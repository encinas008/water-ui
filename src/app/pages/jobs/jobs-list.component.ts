import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { AssignPartnersModalComponent } from './assign-partners-modal.component';
import { JobService } from '../../shared/services/job.service';
import { JobOutputDto } from '../../shared/models/water-system.models';

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
  ],
  templateUrl: './jobs-list.component.html',
  styles: ``
})
export class JobsListComponent implements OnInit {
  jobs: JobOutputDto[] = [];
  filteredJobs: JobOutputDto[] = [];
  paginatedJobs: JobOutputDto[] = [];
  
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
  selectedJobs: Set<string> = new Set();
  
  // Estado
  isLoading: boolean = true;
  errorMessage: string = '';

  // Modal de asignación de socios
  showAssignPartnersModal: boolean = false;
  selectedJobId: string = '';
  selectedJobName: string = '';

  constructor(
    private jobService: JobService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobService.getJobs().subscribe({
      next: (data) => {
        this.jobs = data;
        this.filteredJobs = [...this.jobs];
        this.calculatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar trabajos:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 404) {
          this.errorMessage = 'El endpoint /api/jobs no fue encontrado en el servidor.';
        } else {
          this.errorMessage = `Error al cargar los trabajos: ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.filteredJobs = [...this.jobs];
    } else {
      this.filteredJobs = this.jobs.filter(job => {
        const name = job.name?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';

        return name.includes(query) || description.includes(query);
      });
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredJobs.length / this.itemsPerPage);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedJobs = this.filteredJobs.slice(startIndex, endIndex);
    
    this.startEntry = this.filteredJobs.length > 0 ? startIndex + 1 : 0;
    this.endEntry = Math.min(endIndex, this.filteredJobs.length);
    
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
      this.paginatedJobs.forEach(job => {
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

    this.selectAll = this.paginatedJobs.every(j => j.id && this.selectedJobs.has(j.id));
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
          this.loadJobs(); // Recargar la lista
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
}

