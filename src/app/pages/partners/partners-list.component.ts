import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { PartnerService } from '../../shared/services/partner.service';
import { AuthService } from '../../shared/services/auth.service';
import { PartnerOutputDto, PageResponse } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-partners-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './partners-list.component.html',
  styles: `
    .cdk-virtual-scroll-viewport {
      height: 600px;
    }
    .cdk-virtual-scroll-content-wrapper {
      min-width: 100%;
    }
    .partners-table {
      table-layout: fixed;
      width: 100%;
    }
    .partners-table th,
    .partners-table td {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .col-checkbox { width: 60px; }
    .col-socio { width: 40%; }
    .col-estado { width: 20%; }
    .col-deuda { width: 20%; }
    .col-acciones { width: 20%; }
  `
})
export class PartnersListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  partners: PartnerOutputDto[] = [];

  // Búsqueda con debounce
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  // Paginación del servidor
  currentPage: number = 0;
  pageSize: number = 20;
  totalElements: number = 0;
  totalPages: number = 0;
  isLoadingMore: boolean = false;

  // Selección
  selectAll: boolean = false;
  selectedPartners: Set<string> = new Set();

  // Estado
  isLoading: boolean = true;
  errorMessage: string = '';
  hasMoreData: boolean = true;

  constructor(
    private partnerService: PartnerService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Configurar debounce para búsqueda (500ms)
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.currentPage = 0;
      this.partners = [];
      this.hasMoreData = true;
      this.loadPartners();
    });
  }

  get isAdmin(): boolean {
    const userInfo = this.authService.getUserInfo();
    return userInfo?.role?.toUpperCase() === 'ADMINISTRADOR';
  }

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    if (this.isLoadingMore) return;

    this.isLoading = this.currentPage === 0;
    this.isLoadingMore = this.currentPage > 0;
    this.errorMessage = '';

    const search = this.searchQuery.trim() || undefined;

    this.partnerService.getPartnersPaginated(this.currentPage, this.pageSize, search).subscribe({
      next: (response: PageResponse<PartnerOutputDto>) => {
        if (this.currentPage === 0) {
          this.partners = response.content;
        } else {
          this.partners = [...this.partners, ...response.content];
        }

        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;

        this.isLoading = false;
        this.isLoadingMore = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.isLoadingMore = false;
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
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onScrolledIndexChange(index: number): void {
    // Cargar más datos cuando el usuario está cerca del final
    if (!this.viewport) return;

    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();

    if (end === total && this.hasMoreData && !this.isLoadingMore) {
      this.currentPage++;
      this.loadPartners();
    }
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;

    if (this.selectAll) {
      this.partners.forEach(partner => {
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

    this.selectAll = this.partners.length > 0 && this.partners.every(p => p.id && this.selectedPartners.has(p.id));
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
        return 'Pasivo';
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
          // Recargar desde el inicio
          this.currentPage = 0;
          this.partners = [];
          this.loadPartners();
        },
        error: (error) => {
          console.error('Error al eliminar socio:', error);
          alert('Error al eliminar el socio. Por favor intenta de nuevo.');
        }
      });
    }
  }
}
