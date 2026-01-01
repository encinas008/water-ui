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
  template: `
    <style>
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
      .col-fecha { width: 15%; }
      .col-socio { width: 18%; }
      .col-medidor { width: 12%; }
      .col-anterior { width: 12%; }
      .col-actual { width: 12%; }
      .col-consumo { width: 12%; }
      .col-estado { width: 12%; }
      .col-acciones { width: 7%; }
    </style>
    <div>
      <app-page-breadcrumb pageTitle="Lecturas de Medidor" />

      <!-- Loading State -->
      <div *ngIf="isLoading" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-10">
        <div class="flex flex-col items-center justify-center">
          <svg class="animate-spin h-10 w-10 text-brand-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-600 dark:text-gray-400">Cargando lecturas...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage && !isLoading" class="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 mb-6">
        <p class="text-red-800 dark:text-red-400">{{ errorMessage }}</p>
      </div>

      <!-- Table -->
      <div *ngIf="!isLoading && !errorMessage" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        
        <!-- Header con búsqueda y filtros -->
        <div class="border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <!-- Búsqueda -->
            <div class="relative w-full sm:max-w-xs">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                placeholder="Buscar lecturas..."
                class="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <svg class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-3">
              <app-button
                size="sm"
                variant="outline"
                (btnClick)="resetAndLoadReadings()">
                Actualizar
              </app-button>
              <app-button
                size="sm"
                variant="primary"
                (btnClick)="navigateToAddReading()">
                + Nueva Lectura
              </app-button>
            </div>
          </div>

        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto">
          <table class="w-full table-fixed">
            <thead>
              <tr>
                <th class="col-fecha px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha Lectura
                </th>
                <th class="col-socio px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Socio
                </th>
                <th class="col-medidor px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Medidor
                </th>
                <th class="col-anterior px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lectura Anterior
                </th>
                <th class="col-actual px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lectura Actual
                </th>
                <th class="col-consumo px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Consumo (m³)
                </th>
                <th class="col-estado px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado
                </th>
                <th class="col-acciones px-4 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <cdk-virtual-scroll-viewport itemSize="80" class="cdk-virtual-scroll-viewport" (scrolledIndexChange)="onScrolledIndexChange($event)">
          <table class="w-full table-fixed">
            <tbody>
              <tr *cdkVirtualFor="let reading of (readings || [])" 
                  class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors border-b border-gray-200 dark:border-gray-800">
                <!-- Fecha Lectura -->
                <td class="col-fecha px-4 py-4">
                  <div class="text-sm">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ reading.readingDate | date:'dd/MM/yyyy' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getReadingAge(reading) }}
                    </p>
                  </div>
                </td>

                <!-- Socio -->
                <td class="col-socio px-4 py-4">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ reading.partnerName }}
                  </p>
                </td>

                <!-- Medidor -->
                <td class="col-medidor px-4 py-4">
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    {{ reading.waterMeterNumber || '-' }}
                  </span>
                </td>

                <!-- Lectura Anterior -->
                <td class="col-anterior px-4 py-4 text-left">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    {{ reading.previousReading || 0 | number:'1.2-2' }}
                  </p>
                </td>

                <!-- Lectura Actual -->
                <td class="col-actual px-4 py-4 text-left">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ reading.currentReading | number:'1.2-2' }}
                  </p>
                </td>

                <!-- Consumo -->
                <td class="col-consumo px-4 py-4 text-left">
                  <app-badge 
                    [variant]="'light'" 
                    [color]="getConsumptionColor(reading.consumption)">
                    {{ reading.consumption | number:'1.2-2' }} m³
                  </app-badge>
                </td>

                <!-- Estado -->
                <td class="col-estado px-4 py-4 text-left">
                  <app-badge 
                    [variant]="'light'" 
                    [color]="getStatusColor(reading)">
                    {{ getStatusText(reading) }}
                  </app-badge>
                </td>

                <!-- Acciones -->
                <td class="col-acciones px-4 py-4">
                  <!-- <div class="flex items-center justify-center gap-2">
                    <button
                      [disabled]="true"
                      (click)="viewReading(reading)"
                      class="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                      title="Ver detalles">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button
                      (click)="editReading(reading)"
                      [disabled]="true"
                      class="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      title="Editar">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                  </div> -->
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="!isLoading && (!readings || readings.length === 0)">
                <td colspan="8" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center justify-center">
                    <svg class="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                      No se encontraron lecturas
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {{ searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza registrando tu primera lectura' }}
                    </p>
                    <app-button
                      *ngIf="!searchQuery"
                      size="sm"
                      variant="primary"
                      (btnClick)="navigateToAddReading()">
                      + Agregar Lectura
                    </app-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </cdk-virtual-scroll-viewport>

        <div *ngIf="isLoadingMore" class="flex justify-center py-4">
          <svg class="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- Info de total -->
        <div *ngIf="!isLoading && totalElements > 0" class="border-t border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6 lg:px-8">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Total de lecturas: <span class="font-medium">{{ totalElements }}</span>
          </p>
        </div>
      </div>
    </div>
  `
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
  ) {}

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
