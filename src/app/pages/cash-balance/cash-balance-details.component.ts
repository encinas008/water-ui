import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { CashBalanceDetailsOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-cash-balance-details',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Detalles del Balance de Caja'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <!-- Alertas -->
      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error'
      }">
        <span>{{ alertMessage }}</span>
      </div>

      <div *ngIf="isLoading" class="flex justify-center py-10">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>

      <div *ngIf="!isLoading && cashBalanceDetails" class="space-y-6">
        <!-- Información general -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-black dark:text-white">Información General</h3>
              <div class="flex gap-2">
                <app-button 
                  *ngIf="cashBalanceDetails.active && !cashBalanceDetails.closeTime"
                  (click)="closeBalance()" 
                  [variant]="'secondary'"
                  [className]="'bg-danger text-white hover:bg-danger/90'"
                >
                  Cerrar Balance
                </app-button>
                <app-button (click)="goBack()" [variant]="'secondary'">
                  Volver
                </app-button>
              </div>
            </div>
          </div>
          <div class="p-6.5">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p class="text-sm text-bodydark mb-1">Descripción</p>
                <p class="font-medium text-black dark:text-white">{{ cashBalanceDetails.description || 'Sin descripción' }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark mb-1">Asignado a</p>
                <p class="font-medium text-black dark:text-white">{{ cashBalanceDetails.assignee }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark mb-1">Caja</p>
                <p class="font-medium text-black dark:text-white">{{ cashBalanceDetails.boxName }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark mb-1">Fecha de Apertura</p>
                <p class="font-medium text-black dark:text-white">{{ cashBalanceDetails.openTime | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark mb-1">Fecha de Cierre</p>
                <p class="font-medium text-black dark:text-white">
                  {{ cashBalanceDetails.closeTime ? (cashBalanceDetails.closeTime | date:'dd/MM/yyyy HH:mm') : 'Abierto' }}
                </p>
              </div>
              <div>
                <p class="text-sm text-bodydark mb-1">Estado</p>
                <span [ngClass]="{
                  'px-3 py-1 rounded-full text-xs font-medium': true,
                  'bg-success/10 text-success': cashBalanceDetails.active && !cashBalanceDetails.closeTime,
                  'bg-meta-3/10 text-meta-3': !cashBalanceDetails.active || cashBalanceDetails.closeTime
                }">
                  {{ cashBalanceDetails.active && !cashBalanceDetails.closeTime ? 'Abierto' : 'Cerrado' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen financiero -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Dinero inicial -->
          <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg class="fill-primary dark:fill-white" width="22" height="22" viewBox="0 0 22 22">
                <path d="M11 0C4.9 0 0 4.9 0 11s4.9 11 11 11 11-4.9 11-11S17.1 0 11 0zm0 20c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"/>
                <path d="M11 5v6l4 2"/>
              </svg>
            </div>
            <div class="mt-4">
              <h4 class="text-title-md font-bold text-black dark:text-white">
                BOB {{ cashBalanceDetails.initialMoney | number:'1.2-2' }}
              </h4>
              <span class="text-sm font-medium text-bodydark">Dinero Inicial</span>
            </div>
          </div>

          <!-- Total en caja -->
          <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-success/10">
              <svg class="fill-success" width="22" height="22" viewBox="0 0 22 22">
                <path d="M11 0a11 11 0 100 22 11 11 0 000-22zm5 13l-6 6-4-4 1.5-1.5L10 16l4.5-4.5L16 13z"/>
              </svg>
            </div>
            <div class="mt-4">
              <h4 class="text-title-md font-bold text-black dark:text-white">
                BOB {{ cashBalanceDetails.cashBalanceDetails.totalCashInBox | number:'1.2-2' }}
              </h4>
              <span class="text-sm font-medium text-bodydark">Total en Caja</span>
            </div>
          </div>

          <!-- Total de ventas -->
          <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-3/10">
              <svg class="fill-meta-3" width="22" height="22" viewBox="0 0 22 22">
                <path d="M3 3h16v16H3z"/>
              </svg>
            </div>
            <div class="mt-4">
              <h4 class="text-title-md font-bold text-black dark:text-white">
                BOB {{ cashBalanceDetails.cashBalanceDetails.totalCashFromSales | number:'1.2-2' }}
              </h4>
              <span class="text-sm font-medium text-bodydark">Total</span>
            </div>
          </div>
        </div>

        <!-- Detalles de ventas -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <h3 class="font-medium text-black dark:text-white">Detalles de Ventas</h3>
          </div>
          <div class="p-6.5">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="p-4 bg-gray-2 dark:bg-meta-4 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Efectivo</p>
                <p class="text-xl font-bold text-black dark:text-white">
                  BOB {{ cashBalanceDetails.cashFromSalesDetails.cash | number:'1.2-2' }}
                </p>
              </div>
              <div class="p-4 bg-gray-2 dark:bg-meta-4 rounded-lg">
                <p class="text-sm text-bodydark mb-2">QR</p>
                <p class="text-xl font-bold text-black dark:text-white">
                  BOB {{ cashBalanceDetails.cashFromSalesDetails.qr | number:'1.2-2' }}
                </p>
              </div>
              <div class="p-4 bg-gray-2 dark:bg-meta-4 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Transferencia</p>
                <p class="text-xl font-bold text-black dark:text-white">
                  BOB {{ cashBalanceDetails.cashFromSalesDetails.transference | number:'1.2-2' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detalles de flujos de caja -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <h3 class="font-medium text-black dark:text-white">Flujos de Caja</h3>
          </div>
          <div class="p-6.5">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div class="p-4 bg-success/10 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Entradas en Efectivo</p>
                <p class="text-xl font-bold text-success">
                  BOB {{ cashBalanceDetails.cashFromCashFlowsDetails.cashIn | number:'1.2-2' }}
                </p>
              </div>
              <div class="p-4 bg-success/10 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Entradas QR</p>
                <p class="text-xl font-bold text-success">
                  BOB {{ cashBalanceDetails.cashFromCashFlowsDetails.cashQrIn | number:'1.2-2' }}
                </p>
              </div>
              <div class="p-4 bg-success/10 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Entradas Transferencia</p>
                <p class="text-xl font-bold text-success">
                  BOB {{ cashBalanceDetails.cashFromCashFlowsDetails.cashTransferIn | number:'1.2-2' }}
                </p>
              </div>
              <div class="p-4 bg-danger/10 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Salidas</p>
                <p class="text-xl font-bold text-danger">
                  BOB {{ cashBalanceDetails.cashFromCashFlowsDetails.cashOut | number:'1.2-2' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen final -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <h3 class="font-medium text-black dark:text-white">Resumen Final</h3>
          </div>
          <div class="p-6.5">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="p-4 bg-primary/10 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Total Efectivo</p>
                <p class="text-xl font-bold text-primary">
                  BOB {{ cashBalanceDetails.cashBalanceDetails.totalCash | number:'1.2-2' }}
                </p>
              </div>
              <div class="p-4 bg-meta-3/10 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Total Otros (QR + Transferencia)</p>
                <p class="text-xl font-bold text-meta-3">
                  BOB {{ cashBalanceDetails.cashBalanceDetails.totalOthers | number:'1.2-2' }}
                </p>
              </div>
              <div class="p-4 bg-success/10 rounded-lg">
                <p class="text-sm text-bodydark mb-2">Total en Caja</p>
                <p class="text-2xl font-bold text-success">
                  BOB {{ cashBalanceDetails.cashBalanceDetails.totalCashInBox | number:'1.2-2' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && !cashBalanceDetails" class="rounded-sm border border-stroke bg-white p-10 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
        <p class="text-bodydark">No se pudo cargar la información del balance de caja</p>
        <app-button (click)="goBack()" [variant]="'secondary'" class="mt-4">
          Volver
        </app-button>
      </div>
    </div>
  `
})
export class CashBalanceDetailsComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Detalles', link: '' }
  ];

  cashBalanceDetails: CashBalanceDetailsOutputDto | null = null;
  isLoading = false;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';
  balanceId: string = '';

  constructor(
    private cashBalanceService: CashBalanceService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.balanceId = params['id'];
      if (this.balanceId) {
        this.loadCashBalanceDetails();
      }
    });
  }

  loadCashBalanceDetails(): void {
    this.isLoading = true;
    this.cashBalanceService.getCashBalanceDetails(this.balanceId).subscribe({
      next: (data) => {
        this.cashBalanceDetails = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalles del balance:', error);
        this.showAlertMessage(error.error?.message || 'Error al cargar los detalles del balance', 'error');
        this.isLoading = false;
      }
    });
  }

  closeBalance(): void {
    if (!confirm('¿Está seguro de que desea cerrar este balance de caja?')) {
      return;
    }

    this.cashBalanceService.closeCashBalance({ cashBalanceId: this.balanceId }).subscribe({
      next: (success) => {
        if (success) {
          this.showAlertMessage('Balance de caja cerrado exitosamente', 'success');
          this.loadCashBalanceDetails();
        } else {
          this.showAlertMessage('Error al cerrar el balance de caja', 'error');
        }
      },
      error: (error) => {
        console.error('Error al cerrar balance:', error);
        this.showAlertMessage(error.error?.message || 'Error al cerrar el balance de caja', 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/cash-balances']);
  }

  showAlertMessage(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }
}

