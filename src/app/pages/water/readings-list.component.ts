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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.resetAndLoadReadings();
    });
    this.loadReadings();
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
}
