import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashBalanceOutputDto, PageResponse } from '../../shared/models/water-system.models';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-cash-balances-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent, ScrollingModule],
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
      .col-descripcion { width: 20%; }
      .col-asignado { width: 18%; }
      .col-apertura { width: 15%; }
      .col-cierre { width: 15%; }
      .col-dinero { width: 12%; }
      .col-estado { width: 10%; }
      .col-acciones { width: 10%; }
    </style>
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Balances de Caja'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>



      <!-- Acciones y búsqueda -->
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex gap-3">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Buscar por descripción, asignado a..."
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary sm:w-80"
          />
        </div>
        <div class="flex gap-3">
          <app-button (click)="navigateTo('/cash-balances/open')" [variant]="'primary'">
            <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Abrir Balance de Caja
          </app-button>
          <app-button (click)="resetAndLoadCashBalances()" [variant]="'secondary'">
            <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </app-button>
        </div>
      </div>

      <!-- Tabla de balances -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Lista de Balances de Caja</h3>
        </div>
        <div class="p-6.5">
          <div *ngIf="isLoading" class="flex justify-center py-10">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>

          <table *ngIf="!isLoading" class="w-full table-fixed">
            <thead>
              <tr class="bg-gray-2 text-left dark:bg-meta-4">
                <th class="col-descripcion py-4 px-4 font-medium text-black dark:text-white">Descripción</th>
                <th class="col-asignado py-4 px-4 font-medium text-black dark:text-white">Asignado a</th>
                <th class="col-apertura py-4 px-4 font-medium text-black dark:text-white">Fecha Apertura</th>
                <th class="col-cierre py-4 px-4 font-medium text-black dark:text-white">Fecha Cierre</th>
                <th class="col-dinero py-4 px-4 font-medium text-black dark:text-white text-right">Dinero Inicial</th>
                <th class="col-estado py-4 px-4 font-medium text-black dark:text-white text-center">Estado</th>
                <th class="col-acciones py-4 px-4 font-medium text-black dark:text-white text-center">Acciones</th>
              </tr>
            </thead>
          </table>
        </div>

        <cdk-virtual-scroll-viewport *ngIf="!isLoading" itemSize="80" class="cdk-virtual-scroll-viewport" (scrolledIndexChange)="onScrolledIndexChange($event)">
          <table class="w-full table-fixed">
            <tbody>
              <tr *cdkVirtualFor="let balance of (cashBalances || [])" class="border-b border-[#eee] dark:border-strokedark">
                <td class="col-descripcion py-5 px-4">
                  <p class="text-black dark:text-white font-medium">{{ balance.description || 'Sin descripción' }}</p>
                </td>
                <td class="col-asignado py-5 px-4">
                  <p class="text-black dark:text-white">{{ balance.assignee }}</p>
                </td>
                <td class="col-apertura py-5 px-4">
                  <p class="text-black dark:text-white">{{ balance.openTime | date:'dd/MM/yyyy HH:mm' }}</p>
                </td>
                <td class="col-cierre py-5 px-4">
                  <p class="text-black dark:text-white">
                    {{ balance.closeTime ? (balance.closeTime | date:'dd/MM/yyyy HH:mm') : '-' }}
                  </p>
                </td>
                <td class="col-dinero py-5 px-4 text-right">
                  <p class="text-black dark:text-white font-medium">
                    BOB {{ balance.initialMoney | number:'1.2-2' }}
                  </p>
                </td>
                <td class="col-estado py-5 px-4 text-center">
                  <span [ngClass]="{
                    'px-3 py-1 rounded-full text-xs font-medium': true,
                    'bg-success/10 text-success': balance.active && !balance.closeTime,
                    'bg-meta-3/10 text-meta-3': !balance.active || balance.closeTime
                  }">
                    {{ getBalanceStatus(balance) }}
                  </span>
                </td>
                <td class="col-acciones py-5 px-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        (click)="viewDetails(balance.id)"
                        class="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                        title="Ver detalles"
                      >
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        Ver Detalle
                      </button>
                      <button
                        *ngIf="balance.active && !balance.closeTime"
                        (click)="closeBalance(balance.id)"
                        class="text-danger hover:text-danger/80 font-medium"
                        title="Cerrar balance"
                      >
                        Cerrar
                      </button>
                    </div>
                  </td>
              </tr>
              <tr *ngIf="!isLoading && (!cashBalances || cashBalances.length === 0)">
                <td colspan="7" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center justify-center">
                    <svg class="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                      No se encontraron balances de caja
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {{ searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza abriendo tu primer balance de caja' }}
                    </p>
                    <app-button
                      *ngIf="!searchQuery"
                      size="sm"
                      variant="primary"
                      (btnClick)="navigateTo('/cash-balances/open')">
                      <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Abrir Balance de Caja
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
        <div *ngIf="!isLoading && totalElements > 0" class="border-t border-stroke px-6.5 py-4 dark:border-strokedark">
          <p class="text-sm text-bodydark">
            Total de balances: <span class="font-medium">{{ totalElements }}</span>
          </p>
        </div>
      </div>
    </div>
  `
})
export class CashBalancesListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' }
  ];

  cashBalances: CashBalanceOutputDto[] = [];
  totalElements: number = 0;

  // Búsqueda
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  // Paginación
  currentPage: number = 0; // Backend pages are 0-indexed
  pageSize: number = 20;
  totalPages: number = 0;
  isLoadingMore: boolean = false;

  // Estados
  isLoading: boolean = false;
  hasMoreData: boolean = true;

  constructor(
    private cashBalanceService: CashBalanceService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.resetAndLoadCashBalances();
    });
    this.loadCashBalances();
  }

  loadCashBalances(): void {
    this.isLoading = true;
    this.hasMoreData = true;
    this.currentPage = 0; // Start from the first page

    this.cashBalanceService.getCashBalancesPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<CashBalanceOutputDto>) => {
        this.cashBalances = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar balances de caja:', error);
        toast.error(error.error?.message || 'Error al cargar balances de caja');
        this.isLoading = false;
      }
    });
  }

  loadMoreCashBalances(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMoreData) {
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    this.cashBalanceService.getCashBalancesPaginated(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response: PageResponse<CashBalanceOutputDto>) => {
        this.cashBalances = [...this.cashBalances, ...response.content];
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error al cargar más balances de caja:', error);
        this.isLoadingMore = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  resetAndLoadCashBalances(): void {
    this.cashBalances = [];
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
    this.hasMoreData = true;
    this.loadCashBalances();
  }

  onScrolledIndexChange(index: number): void {
    // Cargar más datos cuando el usuario se acerca al final de la lista
    if (this.viewport && index > this.cashBalances.length - this.pageSize / 2) {
      this.loadMoreCashBalances();
    }
  }

  getBalanceStatus(balance: CashBalanceOutputDto): string {
    if (balance.active && !balance.closeTime) {
      return 'ABIERTO';
    }
    return 'CERRADO';
  }

  viewDetails(id: string): void {
    this.router.navigate(['/cash-balances', id]);
  }

  closeBalance(id: string): void {
    if (!confirm('¿Está seguro de que desea cerrar este balance de caja?')) {
      return;
    }

    this.cashBalanceService.closeCashBalance({ cashBalanceId: id }).subscribe({
      next: (success) => {
        if (success) {
          toast.success('Balance de caja cerrado exitosamente');
          this.resetAndLoadCashBalances();
        } else {
          toast.error('Error al cerrar el balance de caja');
        }
      },
      error: (error) => {
        console.error('Error al cerrar balance:', error);
        toast.error(error.error?.message || 'Error al cerrar el balance de caja');
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }


}

