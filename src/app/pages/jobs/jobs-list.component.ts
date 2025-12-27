import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { AssignPartnersModalComponent } from './assign-partners-modal.component';
import { JobService } from '../../shared/services/job.service';
import { JobOutputDto, PageResponse } from '../../shared/models/water-system.models';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-jobs-list',
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
  templateUrl: './jobs-list.component.html',
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
    .col-nombre { width: 25%; }
    .col-fecha { width: 15%; }
    .col-descripcion { width: 30%; }
    .col-multa { width: 15%; }
    .col-acciones { width: 15%; }
  `
})
export class JobsListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  jobs: JobOutputDto[] = [];
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
  selectedJobs: Set<string> = new Set();
  
  // Estado
  isLoading: boolean = true;
  errorMessage: string = '';
  hasMoreData: boolean = true;

  // Modal de asignación de socios
  showAssignPartnersModal: boolean = false;
  selectedJobId: string = '';
  selectedJobName: string = '';

  constructor(
    private jobService: JobService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.resetAndLoadJobs();
    });
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasMoreData = true;
    this.currentPage = 0; // Start from the first page

    this.jobService.getJobsPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<JobOutputDto>) => {
        this.jobs = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar trabajos:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 404) {
          this.errorMessage = 'Recurso no encontrado.';
        } else {
          this.errorMessage = `Error al cargar los trabajos: ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  loadMoreJobs(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMoreData) {
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    this.jobService.getJobsPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<JobOutputDto>) => {
        this.jobs = [...this.jobs, ...response.content];
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error al cargar más trabajos:', error);
        this.isLoadingMore = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  resetAndLoadJobs(): void {
    this.jobs = [];
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
    this.hasMoreData = true;
    this.loadJobs();
  }

  onScrolledIndexChange(index: number): void {
    // Cargar más datos cuando el usuario se acerca al final de la lista
    if (this.viewport && index > this.jobs.length - this.pageSize / 2) {
      this.loadMoreJobs();
    }
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;

    if (this.selectAll) {
      this.jobs.forEach(job => {
        if (job.id) {
          this.selectedJobs.add(job.id);
        }
      });
    } else {
      this.selectedJobs.clear();
    }
  }

  toggleSelectJob(id: string | undefined): void {
    if (!id) return;

    if (this.selectedJobs.has(id)) {
      this.selectedJobs.delete(id);
    } else {
      this.selectedJobs.add(id);
    }

    this.selectAll = this.jobs.length > 0 && this.jobs.every(j => j.id && this.selectedJobs.has(j.id));
  }

  isSelected(id: string | undefined): boolean {
    return id ? this.selectedJobs.has(id) : false;
  }

  navigateToAddJob(): void {
    this.router.navigate(['/jobs/add']);
  }

  onView(job: JobOutputDto): void {
    this.router.navigate(['/jobs', job.id, 'attendance']);
  }

  onEdit(job: JobOutputDto): void {
    this.router.navigate(['/jobs/edit', job.id]);
  }

  onDelete(job: JobOutputDto): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el trabajo "${job.name}"?`)) {
      this.jobService.deleteJob(job.id).subscribe({
        next: () => {
          console.log('Trabajo eliminado:', job);
          this.resetAndLoadJobs(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar trabajo:', error);
          alert('Error al eliminar el trabajo. Por favor intenta de nuevo.');
        }
      });
    }
  }

  onDownload(): void {
    console.log('Descargando lista de trabajos...');
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

  // Métodos para asignación de socios
  onAssignPartners(job: JobOutputDto): void {
    this.selectedJobId = job.id;
    this.selectedJobName = job.name;
    this.showAssignPartnersModal = true;
  }

  closeAssignPartnersModal(): void {
    this.showAssignPartnersModal = false;
    this.selectedJobId = '';
    this.selectedJobName = '';
  }

  onPartnersAssigned(): void {
    // Opcional: recargar la lista o mostrar mensaje de éxito
    console.log('Socios asignados exitosamente');
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

