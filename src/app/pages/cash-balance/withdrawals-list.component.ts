import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashFlowService } from '../../shared/services/cash-flow.service';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { CashFlowOutputDto, CashBalanceOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-withdrawals-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Lista de Retiros'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <!-- Alertas -->
      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error'
      }">
        <span>{{ alertMessage }}</span>
      </div>

      <!-- Filtros -->
      <div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Filtros</h3>
        </div>
        <div class="p-6.5">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2.5 block text-black dark:text-white">Balance de Caja</label>
              <select [(ngModel)]="selectedCashBalanceId" name="cashBalanceId" 
                (change)="onCashBalanceChange()"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input">
                <option value="">Todos los balances</option>
                <option *ngFor="let balance of cashBalances" [value]="balance.id">
                  {{ balance.description || 'Balance sin descripción' }} - {{ balance.openTime | date:'dd/MM/yyyy HH:mm' }}
                </option>
              </select>
            </div>
            <div class="flex items-end">
              <app-button (click)="loadWithdrawals()" [variant]="'primary'">
                <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Buscar
              </app-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div *ngIf="withdrawals.length > 0" class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-danger/10">
            <svg class="fill-danger" width="22" height="22" viewBox="0 0 22 22">
              <path d="M11 0C4.9 0 0 4.9 0 11s4.9 11 11 11 11-4.9 11-11S17.1 0 11 0zm0 20c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"/>
              <path d="M11 5v6l4 2"/>
            </svg>
          </div>
          <div class="mt-4">
            <h4 class="text-title-md font-bold text-black dark:text-white">
              {{ withdrawals.length }}
            </h4>
            <span class="text-sm font-medium text-bodydark">Total de Retiros</span>
          </div>
        </div>

        <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-danger/10">
            <svg class="fill-danger" width="22" height="22" viewBox="0 0 22 22">
              <path d="M11 0a11 11 0 100 22 11 11 0 000-22zm5 13l-6 6-4-4 1.5-1.5L10 16l4.5-4.5L16 13z"/>
            </svg>
          </div>
          <div class="mt-4">
            <h4 class="text-title-md font-bold text-black dark:text-white">
              BOB {{ getTotalAmount() | number:'1.2-2' }}
            </h4>
            <span class="text-sm font-medium text-bodydark">Monto Total</span>
          </div>
        </div>

        <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-primary/10">
            <svg class="fill-primary" width="22" height="22" viewBox="0 0 22 22">
              <path d="M3 3h16v16H3z"/>
            </svg>
          </div>
          <div class="mt-4">
            <h4 class="text-title-md font-bold text-black dark:text-white">
              BOB {{ getAverageAmount() | number:'1.2-2' }}
            </h4>
            <span class="text-sm font-medium text-bodydark">Promedio por Retiro</span>
          </div>
        </div>
      </div>

      <!-- Tabla de retiros -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-black dark:text-white">Lista de Retiros</h3>
            <app-button (click)="navigateTo('/cash-balances/withdrawal')" [variant]="'primary'">
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Registrar Retiro
            </app-button>
          </div>
        </div>
        <div class="p-6.5">
          <div *ngIf="isLoading" class="flex justify-center py-10">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>

          <div *ngIf="!isLoading && withdrawals.length === 0" class="py-10 text-center text-bodydark">
            No se encontraron retiros
            <div *ngIf="selectedCashBalanceId" class="mt-2 text-sm">
              para el balance de caja seleccionado
            </div>
          </div>

          <div *ngIf="!isLoading && withdrawals.length > 0" class="overflow-x-auto">
            <table class="w-full table-auto">
              <thead>
                <tr class="bg-gray-2 text-left dark:bg-meta-4">
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Fecha</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Descripción</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Balance de Caja</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white">Asignado a</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white text-right">Monto</th>
                  <th class="py-4 px-4 font-medium text-black dark:text-white text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let withdrawal of withdrawals" class="border-b border-[#eee] dark:border-strokedark">
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white">{{ withdrawal.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                  </td>
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white font-medium">{{ withdrawal.description || 'Sin descripción' }}</p>
                  </td>
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white">{{ withdrawal.box }}</p>
                  </td>
                  <td class="py-5 px-4">
                    <p class="text-black dark:text-white">{{ withdrawal.assignee }}</p>
                  </td>
                  <td class="py-5 px-4 text-right">
                    <p class="text-danger dark:text-danger font-bold">
                      BOB {{ withdrawal.amount | number:'1.2-2' }}
                    </p>
                  </td>
                  <td class="py-5 px-4 text-center">
                    <span [ngClass]="{
                      'px-3 py-1 rounded-full text-xs font-medium': true,
                      'bg-success/10 text-success': withdrawal.active,
                      'bg-meta-3/10 text-meta-3': !withdrawal.active
                    }">
                      {{ withdrawal.active ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
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
export class WithdrawalsListComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Lista de Retiros', link: '/cash-balances/withdrawals' }
  ];

  withdrawals: CashFlowOutputDto[] = [];
  cashBalances: CashBalanceOutputDto[] = [];
  selectedCashBalanceId = '';
  isLoading = false;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';

  constructor(
    private cashFlowService: CashFlowService,
    private cashBalanceService: CashBalanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCashBalances();
    this.loadWithdrawals();
  }

  loadCashBalances(): void {
    this.cashBalanceService.getAllCashBalances().subscribe({
      next: (data) => {
        this.cashBalances = data.sort((a, b) => {
          const dateA = new Date(a.openTime).getTime();
          const dateB = new Date(b.openTime).getTime();
          return dateB - dateA;
        });
      },
      error: (error) => {
        console.error('Error al cargar balances de caja:', error);
        this.showAlertMessage('Error al cargar balances de caja', 'error');
      }
    });
  }

  loadWithdrawals(): void {
    this.isLoading = true;

    if (this.selectedCashBalanceId) {
      // Cargar retiros de un balance específico
      this.cashFlowService.getWithdrawalsByCashBalance(this.selectedCashBalanceId).subscribe({
        next: (data) => {
          this.withdrawals = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar retiros:', error);
          this.showAlertMessage('Error al cargar retiros', 'error');
          this.isLoading = false;
        }
      });
    } else {
      // Cargar retiros de todos los balances
      this.loadAllWithdrawals();
    }
  }

  loadAllWithdrawals(): void {
    // Cargar retiros de todos los balances
    const allWithdrawals: CashFlowOutputDto[] = [];
    let completed = 0;
    const total = this.cashBalances.length;

    if (total === 0) {
      this.withdrawals = [];
      this.isLoading = false;
      return;
    }

    this.cashBalances.forEach(balance => {
      this.cashFlowService.getWithdrawalsByCashBalance(balance.id).subscribe({
        next: (data) => {
          allWithdrawals.push(...data);
          completed++;
          if (completed === total) {
            // Ordenar por fecha descendente
            this.withdrawals = allWithdrawals.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error(`Error al cargar retiros del balance ${balance.id}:`, error);
          completed++;
          if (completed === total) {
            this.withdrawals = allWithdrawals.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            this.isLoading = false;
          }
        }
      });
    });
  }

  onCashBalanceChange(): void {
    this.loadWithdrawals();
  }

  getTotalAmount(): number {
    return this.withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
  }

  getAverageAmount(): number {
    if (this.withdrawals.length === 0) return 0;
    return this.getTotalAmount() / this.withdrawals.length;
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



