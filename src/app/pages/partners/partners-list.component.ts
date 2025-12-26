import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { PartnerService } from '../../shared/services/partner.service';
import { PartnerOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-partners-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './partners-list.component.html',
  styles: ``
})
export class PartnersListComponent implements OnInit {
  partners: PartnerOutputDto[] = [];
  filteredPartners: PartnerOutputDto[] = [];
  paginatedPartners: PartnerOutputDto[] = [];
  
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
  selectedPartners: Set<string> = new Set();
  
  // Estado
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private partnerService: PartnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.partnerService.getPartners().subscribe({
      next: (data) => {
        this.partners = data;
        this.filteredPartners = [...this.partners];
        this.calculatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar socios:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 404) {
          this.errorMessage = 'Recurso no encontrado.';
        } else {
          this.errorMessage = `Error al cargar los socios: ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.filteredPartners = [...this.partners];
    } else {
      this.filteredPartners = this.partners.filter(partner => {
        const fullName = partner.fullName?.toLowerCase() || '';
        const email = partner.email?.toLowerCase() || '';
        const dni = partner.partnerIdentificationNumber?.toLowerCase() || '';
        const meterNumber = partner.waterMeterNumber?.toLowerCase() || '';

        return fullName.includes(query) ||
               email.includes(query) ||
               dni.includes(query) ||
               meterNumber.includes(query);
      });
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPartners.length / this.itemsPerPage);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPartners = this.filteredPartners.slice(startIndex, endIndex);
    
    this.startEntry = this.filteredPartners.length > 0 ? startIndex + 1 : 0;
    this.endEntry = Math.min(endIndex, this.filteredPartners.length);
    
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
      this.paginatedPartners.forEach(partner => {
        if (partner.id) {
          this.selectedPartners.add(partner.id);
        }
      });
    } else {
      this.selectedPartners.clear();
    }
  }

  toggleSelectPartner(id: string | undefined): void {
    if (!id) return;

    if (this.selectedPartners.has(id)) {
      this.selectedPartners.delete(id);
    } else {
      this.selectedPartners.add(id);
    }

    this.selectAll = this.paginatedPartners.every(p => p.id && this.selectedPartners.has(p.id));
  }

  isSelected(id: string | undefined): boolean {
    return id ? this.selectedPartners.has(id) : false;
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return '?';
    
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  getAvatarColor(name: string | undefined): string {
    if (!name) return 'bg-gray-500';

    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getStatusColor(status: string | undefined): 'success' | 'warning' | 'error' | 'info' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'CUT_OFF':
        return 'error';
      case 'INACTIVE':
        return 'info';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'SUSPENDED':
        return 'Suspendida';
      case 'CUT_OFF':
        return 'Cortada';
      case 'INACTIVE':
        return 'Inactiva';
      default:
        return 'Sin estado';
    }
  }

  navigateToAddPartner(): void {
    this.router.navigate(['/add-partner']);
  }

  onView(partner: PartnerOutputDto): void {
    if (partner.id) {
      this.router.navigate(['/partners', partner.id]);
    }
  }

  onEdit(partner: PartnerOutputDto): void {
    if (partner.id) {
      this.router.navigate(['/partners/edit', partner.id]);
    }
  }

  onDelete(partner: PartnerOutputDto): void {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${partner.fullName}?`)) {
      this.partnerService.deletePartner(partner.id).subscribe({
        next: () => {
          console.log('Socio eliminado:', partner);
          this.loadPartners(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar socio:', error);
          alert('Error al eliminar el socio. Por favor intenta de nuevo.');
        }
      });
    }
  }

  onDownload(): void {
    console.log('Descargando lista de socios...');
    // TODO: Implementar descarga a Excel/PDF
    alert('Función de descarga en desarrollo');
  }
}
