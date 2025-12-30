import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { AssignPartnersModalComponent } from './assign-partners-modal.component';
import { MeetingService } from '../../shared/services/meeting.service';
import { MeetingOutputDto, PageResponse } from '../../shared/models/water-system.models';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-meetings-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
    AssignPartnersModalComponent,
    ScrollingModule,
  ],
  templateUrl: './meetings-list.component.html',
  styles: `
    .cdk-virtual-scroll-viewport {
      height: 600px;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }
    .cdk-virtual-scroll-content-wrapper {
      min-width: 100%;
    }
    .table-fixed {
      table-layout: fixed;
    }
    .col-checkbox { width: 60px; }
    .col-nombre { width: 18%; }
    .col-tipo { width: 12%; }
    .col-fecha { width: 12%; }
    .col-hora { width: 10%; }
    .col-descripcion { width: 20%; }
    .col-multa { width: 12%; }
    .col-acciones { width: 14%; }
  `
})
export class MeetingsListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  meetings: MeetingOutputDto[] = [];
  totalElements: number = 0;

  // Búsqueda
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  // Paginación
  currentPage: number = 0; // Backend pages are 0-indexed
  pageSize: number = 20;
  totalPages: number = 0;
  isLoadingMore: boolean = false;

  // Selección
  selectAll: boolean = false;
  selectedMeetings: Set<string> = new Set();

  // Estado
  isLoading: boolean = true;
  errorMessage: string = '';
  hasMoreData: boolean = true;

  // Modal de asignación de socios
  showAssignPartnersModal: boolean = false;
  selectedMeetingId: string = '';
  selectedMeetingName: string = '';

  constructor(
    private meetingService: MeetingService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.resetAndLoadMeetings();
    });
    this.loadMeetings();
  }

  loadMeetings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasMoreData = true;
    this.currentPage = 0; // Start from the first page

    this.meetingService.getMeetingsPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<MeetingOutputDto>) => {
        this.meetings = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar reuniones:', error);

        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 404) {
          this.errorMessage = 'Recurso no encontrado.';
        } else {
          this.errorMessage = `Error al cargar las reuniones: ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  loadMoreMeetings(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMoreData) {
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    this.meetingService.getMeetingsPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<MeetingOutputDto>) => {
        this.meetings = [...this.meetings, ...response.content];
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error al cargar más reuniones:', error);
        this.isLoadingMore = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  resetAndLoadMeetings(): void {
    this.meetings = [];
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
    this.hasMoreData = true;
    this.loadMeetings();
  }

  onScrolledIndexChange(index: number): void {
    // Cargar más datos cuando el usuario se acerca al final de la lista
    if (this.viewport && index > this.meetings.length - this.pageSize / 2) {
      this.loadMoreMeetings();
    }
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;

    if (this.selectAll) {
      this.meetings.forEach(meeting => {
        if (meeting.id) {
          this.selectedMeetings.add(meeting.id);
        }
      });
    } else {
      this.selectedMeetings.clear();
    }
  }

  toggleSelectMeeting(id: string | undefined): void {
    if (!id) return;

    if (this.selectedMeetings.has(id)) {
      this.selectedMeetings.delete(id);
    } else {
      this.selectedMeetings.add(id);
    }

    this.selectAll = this.meetings.length > 0 && this.meetings.every(m => m.id && this.selectedMeetings.has(m.id));
  }

  isSelected(id: string | undefined): boolean {
    return id ? this.selectedMeetings.has(id) : false;
  }

  navigateToAddMeeting(): void {
    this.router.navigate(['/meetings/add']);
  }

  onView(meeting: MeetingOutputDto): void {
    this.router.navigate(['/meetings', meeting.id, 'attendance']);
  }

  onAssignPartners(meeting: MeetingOutputDto): void {
    this.selectedMeetingId = meeting.id;
    this.selectedMeetingName = meeting.name;
    this.showAssignPartnersModal = true;
  }

  closeAssignPartnersModal(): void {
    this.showAssignPartnersModal = false;
    this.selectedMeetingId = '';
    this.selectedMeetingName = '';
  }

  onPartnersAssigned(): void {
    console.log('Socios asignados exitosamente.');
  }

  onEdit(meeting: MeetingOutputDto): void {
    this.router.navigate(['/meetings/edit', meeting.id]);
  }

  onDelete(meeting: MeetingOutputDto): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la reunión "${meeting.name}"?`)) {
      this.meetingService.deleteMeeting(meeting.id).subscribe({
        next: () => {
          console.log('Reunión eliminada:', meeting);
          this.resetAndLoadMeetings(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar reunión:', error);
          toast.error('Error al eliminar la reunión. Por favor intenta de nuevo.');
        }
      });
    }
  }

  onDownload(): void {
    console.log('Descargando lista de reuniones...');
    // TODO: Implementar descarga a Excel/PDF
    toast.info('Función de descarga en desarrollo');
  }

  // Formatear fecha a formato español "Jun 15, 2015"
  formatDateSpanish(dateString: string): string {
    if (!dateString) return '';

    // Extraer solo la fecha (YYYY-MM-DD) ignorando hora y timezone
    const soloFecha = dateString.split(/[T ]/)[0];
    const [year, month, day] = soloFecha.split('-').map(Number);

    if (!year || !month || !day) return '';

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return `${months[month - 1]} ${day}, ${year}`;
  }

  // Formatear hora en formato 12 horas con AM/PM
  formatTime(hour: number, minute: number, amPm: string): string {
    const minuteStr = String(minute).padStart(2, '0');
    return `${hour}:${minuteStr} ${amPm}`;
  }

  // Formatear moneda
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 'BOB 0.00';
    return 'BOB ' + new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

