import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashBalanceOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-cash-balances-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Balances de Caja'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <!-- Alertas -->
      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error'
      }">
        <span>{{ alertMessage }}</span>
      </div>

      <!-- Acciones -->
      <div class="mb-6 flex justify-end">
        <app-button (click)="navigateTo('/cash-balances/open')" [variant]="'primary'">
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Abrir Balance de Caja
        </app-button>
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

          <div *ngIf="!isLoading && cashBalances.length === 0" class="py-10 text-center text-bodydark">
            No se encontraron balances de caja
          </div>

          <div *ngIf="!isLoading && cashBalances.length > 0" class="overflow-x-auto">
            <table class="w-full table-auto">
              <thead>
                <tr class="bg-gray-2 text-left dark:bg-meta-4">
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Descripción</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Asignado a</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Fecha Apertura</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Fecha Cierre</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white text-right">Dinero Inicial</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white text-center">Estado</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let balance of cashBalances" class="border-b border-[#eee] dark:border-strokedark">
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white font-medium">{{ balance.description || 'Sin descripción' }}</p>
                  </td>
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white">{{ balance.assignee }}</p>
                  </td>
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white">{{ balance.openTime | date:'dd/MM/yyyy HH:mm' }}</p>
                  </td>
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white">
                      {{ balance.closeTime ? (balance.closeTime | date:'dd/MM/yyyy HH:mm') : '-' }}
                    </p>
                  </td>
                  <td class="py-5 px-4 text-right">
                    <p class="text-black dark:text-white font-medium">
                      BOB {{ balance.initialMoney | number:'1.2-2' }}
                    </p>
                  </td>
                  <td class="py-5 px-4 text-center">
                    <span [ngClass]="{
                      'px-3 py-1 rounded-full text-xs font-medium': true,
                      'bg-success/10 text-success': balance.active && !balance.closeTime,
                      'bg-meta-3/10 text-meta-3': !balance.active || balance.closeTime
                    }">
                      {{ getBalanceStatus(balance) }}
                    </span>
                  </td>
                  <td class="py-5 px-4 text-center">
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CashBalancesListComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' }
  ];

  cashBalances: CashBalanceOutputDto[] = [];
  isLoading = false;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';

  constructor(
    private cashBalanceService: CashBalanceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCashBalances();
  }

  loadCashBalances(): void {
    this.isLoading = true;

    // Cargar todos los balances activos sin filtrar por usuario
    this.cashBalanceService.getAllCashBalances().subscribe({
      next: (data) => {
        // Ordenar por fecha de apertura descendente (más recientes primero)
        this.cashBalances = data.sort((a, b) => {
          const dateA = new Date(a.openTime).getTime();
          const dateB = new Date(b.openTime).getTime();
          return dateB - dateA;
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar balances de caja:', error);
        this.showAlertMessage(error.error?.message || 'Error al cargar balances de caja', 'error');
        this.isLoading = false;
      }
    });
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
          this.showAlertMessage('Balance de caja cerrado exitosamente', 'success');
          this.loadCashBalances();
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

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  showAlertMessage(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }
}

