import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { WaterReadingService } from '../../shared/services/water-reading.service';
import { WaterMeterReadingOutputDto, PageResponse } from '../../shared/models/water-system.models';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { toast } from 'ngx-sonner';
import Swal from 'sweetalert2';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-readings-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
    ScrollingModule,
  ],
  templateUrl: './readings-list.component.html',
  styleUrls: ['./readings-list.component.css']
})
export class ReadingsListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  readings: WaterMeterReadingOutputDto[] = [];
  totalElements: number = 0;

  // Búsqueda
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  // Dashboard Stats
  currentMonthReadings: number = 0;

  // Paginación
  currentPage: number = 0; // Backend pages are 0-indexed
  pageSize: number = 20;
  totalPages: number = 0;
  isLoadingMore: boolean = false;

  // Estado
  isLoading: boolean = true;
  errorMessage: string = '';
  hasMoreData: boolean = true;

  constructor(
    private waterReadingService: WaterReadingService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.resetAndLoadReadings();
    });
    this.loadReadings();
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    this.waterReadingService.getReadingsByPeriod(startOfMonth, endOfMonth).subscribe({
      next: (readings) => {
        this.currentMonthReadings = readings.length;
      },
      error: (err) => console.error('Error loading dashboard stats:', err)
    });
  }

  loadReadings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasMoreData = true;
    this.currentPage = 0; // Start from the first page

    this.waterReadingService.getReadingsPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<WaterMeterReadingOutputDto>) => {
        this.readings = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar lecturas:', error);
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  loadMoreReadings(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMoreData) {
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    this.waterReadingService.getReadingsPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<WaterMeterReadingOutputDto>) => {
        this.readings = [...this.readings, ...response.content];
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error al cargar más lecturas:', error);
        this.isLoadingMore = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  resetAndLoadReadings(): void {
    this.readings = [];
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
    this.hasMoreData = true;
    this.loadReadings();
  }

  onScrolledIndexChange(index: number): void {
    // Cargar más datos cuando el usuario se acerca al final de la lista
    if (this.viewport && index > this.readings.length - this.pageSize / 2) {
      this.loadMoreReadings();
    }
  }

  navigateToAddReading(): void {
    this.router.navigate(['/water-readings/add']);
  }

  viewReading(reading: WaterMeterReadingOutputDto): void {
    this.router.navigate(['/water-readings', reading.id]);
  }

  editReading(reading: WaterMeterReadingOutputDto): void {
    this.router.navigate(['/water-readings/edit', reading.id]);
  }

  onDelete(reading: WaterMeterReadingOutputDto): void {
    const userInfo = this.authService.getUserInfo();
    const userId = userInfo?.userId;

    if (!userId) {
      toast.error('No se pudo identificar al usuario para realizar esta acción');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Deseas eliminar la lectura de ${reading.partnerName} (${reading.readingDate})? Si tiene una factura asociada (pagada o pendiente), esta será ANULADA.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.waterReadingService.deleteReading(reading.id, userId).subscribe({
          next: () => {
            toast.success('Lectura eliminada y factura anulada exitosamente');
            this.resetAndLoadReadings();
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error al eliminar lectura:', error);

            let message = 'Error al eliminar la lectura';
            if (error.error) {
              if (typeof error.error === 'string') {
                message = error.error;
              } else if (error.error.message) {
                message = error.error.message;
              }
            }

            toast.error(message);
          }
        });
      }
    });
  }

  getErrorMessage(error: any): string {
    if (error.status === 401) return 'Se requiere autenticación. Por favor inicia sesión.';
    if (error.status === 0) return 'No se puede conectar al servidor.';
    return 'Error al cargar las lecturas.';
  }

  // Métodos para determinar colores y estados
  getConsumptionColor(consumption: number): 'success' | 'warning' | 'error' | 'info' {
    if (!consumption || consumption <= 0) {
      return 'info';
    } else if (consumption < 10) {
      return 'info';
    } else if (consumption <= 50) {
      return 'success';
    } else if (consumption <= 100) {
      return 'warning';
    } else {
      return 'error';
    }
  }

  getStatusColor(reading: WaterMeterReadingOutputDto): 'success' | 'warning' | 'error' | 'info' {
    const daysSinceReading = this.getDaysSinceReading(reading);

    if (daysSinceReading <= 7) {
      return 'success';
    } else if (daysSinceReading <= 30) {
      return 'info';
    } else {
      return 'warning';
    }
  }

  getStatusText(reading: WaterMeterReadingOutputDto): string {
    const daysSinceReading = this.getDaysSinceReading(reading);

    if (daysSinceReading <= 7) {
      return 'Reciente';
    } else if (daysSinceReading <= 30) {
      return 'Normal';
    } else {
      return 'Antigua';
    }
  }

  getReadingAge(reading: WaterMeterReadingOutputDto): string {
    const daysSinceReading = this.getDaysSinceReading(reading);

    if (daysSinceReading === 0) {
      return 'Hoy';
    } else if (daysSinceReading === 1) {
      return 'Ayer';
    } else if (daysSinceReading < 7) {
      return `Hace ${daysSinceReading} días`;
    } else if (daysSinceReading < 30) {
      const weeks = Math.floor(daysSinceReading / 7);
      return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      const months = Math.floor(daysSinceReading / 30);
      return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
  }

  getDaysSinceReading(reading: WaterMeterReadingOutputDto): number {
    const readingDate = new Date(reading.readingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    readingDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - readingDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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

}
