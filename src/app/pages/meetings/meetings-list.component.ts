import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { AssignPartnersModalComponent } from './assign-partners-modal.component';
import { MeetingService } from '../../shared/services/meeting.service';
import { MeetingOutputDto } from '../../shared/models/water-system.models';

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
  ],
  templateUrl: './meetings-list.component.html',
  styles: ``
})
export class MeetingsListComponent implements OnInit {
  meetings: MeetingOutputDto[] = [];
  filteredMeetings: MeetingOutputDto[] = [];
  paginatedMeetings: MeetingOutputDto[] = [];
  
  // Búsqueda
  searchQuery: string = '';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  itemsPerPageOptions: number[] = [5, 10, 20, 50, 100];
  totalPages: number = 1;
  pageNumbers: number[] = [];
  startEntry: number = 0;
  endEntry: number = 0;
  
  // Selección
  selectAll: boolean = false;
  selectedMeetings: Set<string> = new Set();
  
  // Estado
  isLoading: boolean = true;
  errorMessage: string = '';

  // Modal de asignación de socios
  showAssignPartnersModal: boolean = false;
  selectedMeetingId: string = '';
  selectedMeetingName: string = '';

  constructor(
    private meetingService: MeetingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMeetings();
  }

  loadMeetings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.meetingService.getMeetings().subscribe({
      next: (data) => {
        this.meetings = data;
        this.filteredMeetings = [...this.meetings];
        this.calculatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar reuniones:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 404) {
          this.errorMessage = 'El endpoint /api/meetings no fue encontrado en el servidor.';
        } else {
          this.errorMessage = `Error al cargar las reuniones: ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.filteredMeetings = [...this.meetings];
    } else {
      this.filteredMeetings = this.meetings.filter(meeting => {
        const name = meeting.name?.toLowerCase() || '';
        const description = meeting.description?.toLowerCase() || '';

        return name.includes(query) || description.includes(query);
      });
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredMeetings.length / this.itemsPerPage);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMeetings = this.filteredMeetings.slice(startIndex, endIndex);
    
    this.startEntry = this.filteredMeetings.length > 0 ? startIndex + 1 : 0;
    this.endEntry = Math.min(endIndex, this.filteredMeetings.length);
    
    this.updatePageNumbers();
  }

  updatePageNumbers(): void {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    this.pageNumbers = pages;
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.calculatePagination();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.calculatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.calculatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.calculatePagination();
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;

    if (this.selectAll) {
      this.paginatedMeetings.forEach(meeting => {
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

    this.selectAll = this.paginatedMeetings.every(m => m.id && this.selectedMeetings.has(m.id));
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
          this.loadMeetings(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar reunión:', error);
          alert('Error al eliminar la reunión. Por favor intenta de nuevo.');
        }
      });
    }
  }

  onDownload(): void {
    console.log('Descargando lista de reuniones...');
    // TODO: Implementar descarga a Excel/PDF
    alert('Función de descarga en desarrollo');
  }

  // Formatear fecha a formato español "Jun 15, 2015"
  formatDateSpanish(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  // Formatear hora en formato 12 horas con AM/PM
  formatTime(hour: number, minute: number, amPm: string): string {
    const minuteStr = String(minute).padStart(2, '0');
    return `${hour}:${minuteStr} ${amPm}`;
  }

  // Formatear moneda
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

