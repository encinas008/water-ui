import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { WaterBillOutputDto, WaterBillDetailDto, BillStatus } from '../../shared/models/water-system.models';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-bills-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
    ModalComponent
  ],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Facturas de Agua'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <!-- Alertas -->
      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error',
        'bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200': alertType === 'info'
      }">
        <div class="flex items-center justify-between">
          <span>{{ alertMessage }}</span>
          <button (click)="showAlert = false" class="text-2xl">&times;</button>
        </div>
      </div>

      <!-- Métricas rápidas -->
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="flex items-end justify-between">
            <div>
              <h4 class="text-title-md font-bold text-black dark:text-white">
                {{ bills.length }}
              </h4>
              <span class="text-sm font-medium">Total Facturas</span>
            </div>
            <span class="flex items-center justify-center rounded-full bg-meta-2 w-11 h-11">
              <svg class="h-5 w-5 fill-primary" viewBox="0 0 22 22">
                <path d="M3 3h16v16H3z"/>
              </svg>
            </span>
          </div>
        </div>

        <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="flex items-end justify-between">
            <div>
              <h4 class="text-title-md font-bold text-black dark:text-white">
                {{ getPendingBillsCount() }}
              </h4>
              <span class="text-sm font-medium">Pendientes</span>
            </div>
            <span class="flex items-center justify-center rounded-full bg-meta-2 w-11 h-11">
              <svg class="h-5 w-5 fill-warning" viewBox="0 0 22 22">
                <path d="M11 0l3 8h8l-6.5 5 2.5 8-7-5-7 5 2.5-8L0 8h8z"/>
              </svg>
            </span>
          </div>
        </div>

        <div class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div class="flex items-end justify-between">
            <div>
              <h4 class="text-title-md font-bold text-black dark:text-white">
                {{ formatCurrency(getTotalPending()) }}
              </h4>
              <span class="text-sm font-medium">Total Pendiente</span>
            </div>
            <span class="flex items-center justify-center rounded-full bg-meta-2 w-11 h-11">
              <svg class="h-5 w-5 fill-success" viewBox="0 0 22 22">
                <path d="M11 0C4.9 0 0 4.9 0 11s4.9 11 11 11 11-4.9 11-11S17.1 0 11 0z"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Filtros y acciones -->
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex gap-3">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Buscar por socio, número de factura..."
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary sm:w-80"
          />
          
          <select
            [(ngModel)]="filterStatus"
            (change)="onFilterChange()"
            class="rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="OVERDUE">Vencidas</option>
            <option value="PARTIAL_PAID">Parcialmente Pagadas</option>
            <option value="PAID">Pagadas</option>
          </select>
        </div>

        <div class="flex gap-3">
          <app-button (click)="navigateToGenerateBills()" [variant]="'primary'">
            <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Generar Facturas
          </app-button>
          <app-button (click)="loadBills()" [variant]="'secondary'">
            <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </app-button>
        </div>
      </div>

      <!-- Tabla de facturas -->
      <div class="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div class="max-w-full overflow-x-auto">
          <div *ngIf="isLoading" class="flex justify-center py-10">
            <div class="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>

          <div *ngIf="!isLoading && errorMessage" class="py-10 text-center text-red-500">
            {{ errorMessage }}
          </div>

          <table *ngIf="!isLoading && !errorMessage" class="w-full table-auto">
            <thead>
              <tr class="bg-gray-2 text-left dark:bg-meta-4">
                <th class="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  N° Factura
                </th>
                <th class="min-w-[180px] py-4 px-4 font-medium text-black dark:text-white">
                  Socio
                </th>
                <th class="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  Mes
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white text-right">
                  Consumo (m³)
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white text-right">
                  Total
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white text-right">
                  Pagado
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white text-right">
                  Saldo
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Estado
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of paginatedBills" class="border-b border-[#eee] dark:border-strokedark">
                <td class="py-5 px-4">
                  <p class="text-black dark:text-white font-medium">{{ bill.billNumber }}</p>
                </td>
                <td class="py-5 px-4">
                  <p class="text-black dark:text-white">{{ bill.partnerName }}</p>
                  <p class="text-sm text-bodydark">{{ bill.waterConnectionNumber }}</p>
                </td>
                <td class="py-5 px-4">
                  <p class="text-sm">
                    {{ formatBillingMonth(bill) }}
                  </p>
                </td>
                <td class="py-5 px-4 text-right">
                  <p class="text-meta-3 font-medium">{{ bill.consumptionM3 | number:'1.2-2' }}</p>
                </td>
                <td class="py-5 px-4 text-right">
                  <p class="text-black dark:text-white font-medium">{{ bill.totalAmount | currency:'USD':'symbol':'1.2-2' }}</p>
                </td>
                <td class="py-5 px-4 text-right">
                  <p class="text-success">{{ bill.paidAmount | currency:'USD':'symbol':'1.2-2' }}</p>
                </td>
                <td class="py-5 px-4 text-right">
                  <p [class.text-danger]="bill.remainingBalance > 0" class="font-medium">
                    {{ bill.remainingBalance | currency:'USD':'symbol':'1.2-2' }}
                  </p>
                </td>
                <td class="py-5 px-4">
                  <span [ngClass]="getBillStatusClass(bill.statusCode)">
                    {{ bill.statusName }}
                  </span>
                </td>
                <td class="py-5 px-4">
                  <div class="flex items-center space-x-3.5">
                    <button (click)="viewBill(bill)" class="hover:text-primary" title="Ver detalle">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                    <button *ngIf="bill.remainingBalance > 0" (click)="registerPayment(bill)" class="hover:text-success" title="Registrar pago">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredBills.length === 0">
                <td colspan="9" class="py-10 text-center text-bodydark">
                  No se encontraron facturas
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div *ngIf="filteredBills.length > 0" class="flex justify-between border-t border-stroke py-4 dark:border-strokedark">
          <div class="flex items-center">
            <span class="text-sm text-bodydark">
              Mostrando {{ startEntry }} - {{ endEntry }} de {{ filteredBills.length }} facturas
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <button 
              (click)="previousPage()" 
              [disabled]="currentPage === 1"
              class="rounded bg-gray px-3 py-1 text-sm font-medium text-black hover:bg-gray-2 disabled:opacity-50 dark:bg-meta-4 dark:text-white"
            >
              Anterior
            </button>
            <button 
              *ngFor="let page of pageNumbers"
              (click)="goToPage(page)"
              [class.bg-primary]="page === currentPage"
              [class.text-white]="page === currentPage"
              class="rounded px-3 py-1 text-sm font-medium hover:bg-gray-2 dark:hover:bg-meta-4"
            >
              {{ page }}
            </button>
            <button 
              (click)="nextPage()" 
              [disabled]="currentPage === totalPages"
              class="rounded bg-gray px-3 py-1 text-sm font-medium text-black hover:bg-gray-2 disabled:opacity-50 dark:bg-meta-4 dark:text-white"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle de Factura -->
    <app-modal [isOpen]="showBillDetailModal" (close)="closeBillDetailModal()" [className]="'max-w-5xl max-h-[90vh] overflow-y-auto'">
      <div class="p-6">
        <h2 class="mb-6 text-2xl font-bold text-black dark:text-white">Detalle de Factura</h2>
        
        <div *ngIf="isLoadingBillDetail" class="flex justify-center py-10">
          <div class="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>

        <div *ngIf="!isLoadingBillDetail && billDetail">
          <!-- Información de la Factura -->
          <div class="mb-6 rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
            <h3 class="mb-4 text-xl font-semibold text-black dark:text-white">Información de la Factura</h3>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p class="text-sm text-bodydark">Número de Factura</p>
                <p class="font-medium text-black dark:text-white">{{ billDetail.bill.billNumber }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark">Socio</p>
                <p class="font-medium text-black dark:text-white">{{ billDetail.bill.partnerName }}</p>
                <p class="text-xs text-bodydark" *ngIf="billDetail.bill.waterConnectionNumber">{{ billDetail.bill.waterConnectionNumber }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark">Período</p>
                <p class="font-medium text-black dark:text-white">{{ formatBillingMonth(billDetail.bill) }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark">Estado</p>
                <span [ngClass]="getBillStatusClass(billDetail.bill.statusCode)">
                  {{ billDetail.bill.statusName }}
                </span>
              </div>
              <div>
                <p class="text-sm text-bodydark">Consumo (m³)</p>
                <p class="font-medium text-black dark:text-white">{{ billDetail.bill.consumptionM3 | number:'1.2-2' }} m³</p>
              </div>
              <div>
                <p class="text-sm text-bodydark">Tarifa por m³</p>
                <p class="font-medium text-black dark:text-white">BOB {{ billDetail.bill.ratePerM3 | number:'1.2-2' }}</p>
              </div>
            </div>

            <!-- Conceptos de la Factura -->
            <div *ngIf="billDetail.bill.concepts && billDetail.bill.concepts.length > 0" class="mb-6">
              <h4 class="mb-3 text-lg font-semibold text-black dark:text-white">Conceptos de Cobro</h4>
              <div class="rounded-lg border border-stroke bg-gray-50 dark:bg-meta-4 p-4">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-stroke dark:border-strokedark">
                      <th class="text-left py-2 font-medium text-black dark:text-white">Concepto</th>
                      <th class="text-left py-2 font-medium text-black dark:text-white">Fecha</th>
                      <th class="text-right py-2 font-medium text-black dark:text-white">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let concept of billDetail.bill.concepts" class="border-b border-stroke dark:border-strokedark">
                      <td class="py-2 text-bodydark">{{ concept.conceptName }}</td>
                      <td class="py-2 text-bodydark">{{ concept.assignedDate | date:'dd/MM/yyyy' }}</td>
                      <td class="py-2 text-right font-medium text-black dark:text-white">BOB {{ concept.amount | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="border-t-2 border-stroke dark:border-strokedark">
                      <td colspan="2" class="py-2 font-bold text-black dark:text-white">Total Factura</td>
                      <td class="py-2 text-right font-bold text-lg text-black dark:text-white">BOB {{ billDetail.bill.totalAmount | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Resumen de Pagos -->
            <div class="grid grid-cols-3 gap-4 pt-4 border-t border-stroke dark:border-strokedark">
              <div>
                <p class="text-sm text-bodydark">Total Factura</p>
                <p class="text-lg font-bold text-black dark:text-white">BOB {{ billDetail.bill.totalAmount | number:'1.2-2' }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark">Pagado (Factura)</p>
                <p class="text-lg font-bold text-success">BOB {{ billDetail.bill.paidAmount | number:'1.2-2' }}</p>
              </div>
              <div>
                <p class="text-sm text-bodydark">Saldo Pendiente</p>
                <p class="text-lg font-bold" [class.text-danger]="billDetail.bill.remainingBalance > 0" [class.text-success]="billDetail.bill.remainingBalance === 0">
                  BOB {{ billDetail.bill.remainingBalance | number:'1.2-2' }}
                </p>
              </div>
            </div>

            <!-- Total de Multas Pagadas -->
            <div *ngIf="getTotalFinesPaid() > 0" class="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
              <div class="flex justify-between items-center">
                <p class="text-sm font-medium text-bodydark">Total Multas Pagadas en esta Factura:</p>
                <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">BOB {{ getTotalFinesPaid() | number:'1.2-2' }}</p>
              </div>
            </div>
          </div>

          <!-- Historial de Pagos -->
          <div class="mb-6">
            <h3 class="mb-4 text-xl font-semibold text-black dark:text-white">Historial de Pagos ({{ billDetail.payments.length }})</h3>
            <div *ngIf="billDetail.payments.length === 0" class="rounded-lg border border-stroke bg-white p-8 text-center dark:border-strokedark dark:bg-boxdark">
              <svg class="mx-auto h-12 w-12 text-bodydark mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-bodydark font-medium">No hay pagos registrados para esta factura</p>
            </div>
            <div *ngIf="billDetail.payments.length > 0" class="space-y-4">
              <div *ngFor="let payment of billDetail.payments" class="rounded-lg border-2 border-stroke bg-white p-5 dark:border-strokedark dark:bg-boxdark shadow-sm">
                <!-- Encabezado del Pago -->
                <div class="mb-4 flex items-center justify-between border-b border-stroke dark:border-strokedark pb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1">
                      <p class="text-lg font-bold text-black dark:text-white">Recibo #{{ payment.receiptNumber }}</p>
                      <span class="px-2 py-1 text-xs font-medium rounded bg-success/10 text-success">
                        {{ payment.paymentTypeName }}
                      </span>
                    </div>
                    <p class="text-sm text-bodydark">
                      <svg class="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      {{ payment.paymentDate | date:'dd/MM/yyyy HH:mm' }}
                    </p>
                    <p class="text-sm text-bodydark" *ngIf="payment.cashierName">
                      <svg class="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Cajero: {{ payment.cashierName }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-bodydark mb-1">Total Pagado</p>
                    <p class="text-2xl font-bold text-success">BOB {{ payment.amount | number:'1.2-2' }}</p>
                  </div>
                </div>

                <!-- Desglose del Pago -->
                <div class="space-y-3">
                  <!-- Monto de Factura -->
                  <div class="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <div>
                      <p class="font-medium text-black dark:text-white">Pago por Factura</p>
                      <p class="text-xs text-bodydark">Monto aplicado a esta factura</p>
                    </div>
                    <p class="text-lg font-bold text-black dark:text-white">
                      BOB {{ payment.paymentDetail?.billAmount || payment.amount | number:'1.2-2' }}
                    </p>
                  </div>

                  <!-- Multas -->
                  <div *ngIf="payment.paymentDetail && payment.paymentDetail.finesAmount > 0" class="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
                    <div class="flex justify-between items-center mb-3">
                      <p class="font-semibold text-black dark:text-white">Multas Pagadas</p>
                      <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        BOB {{ payment.paymentDetail.finesAmount | number:'1.2-2' }}
                      </p>
                    </div>

                    <!-- Multas de Trabajos -->
                    <div *ngIf="payment.paymentDetail.jobFines.length > 0" class="mb-3">
                      <p class="text-sm font-medium text-black dark:text-white mb-2 flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        Multas de Trabajos ({{ payment.paymentDetail.jobFines.length }})
                      </p>
                      <div class="ml-5 space-y-1">
                        <div *ngFor="let fine of payment.paymentDetail.jobFines" class="flex justify-between items-center text-sm bg-white dark:bg-boxdark rounded px-2 py-1">
                          <div class="flex-1">
                            <p class="font-medium text-black dark:text-white">{{ fine.name }}</p>
                            <p class="text-xs text-bodydark">{{ fine.date | date:'dd/MM/yyyy' }}</p>
                          </div>
                          <p class="font-semibold text-black dark:text-white">BOB {{ fine.fineAmount | number:'1.2-2' }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Multas de Reuniones -->
                    <div *ngIf="payment.paymentDetail.meetingFines.length > 0">
                      <p class="text-sm font-medium text-black dark:text-white mb-2 flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        Multas de Reuniones ({{ payment.paymentDetail.meetingFines.length }})
                      </p>
                      <div class="ml-5 space-y-1">
                        <div *ngFor="let fine of payment.paymentDetail.meetingFines" class="flex justify-between items-center text-sm bg-white dark:bg-boxdark rounded px-2 py-1">
                          <div class="flex-1">
                            <p class="font-medium text-black dark:text-white">{{ fine.name }}</p>
                            <p class="text-xs text-bodydark">{{ fine.date | date:'dd/MM/yyyy' }}</p>
                          </div>
                          <p class="font-semibold text-black dark:text-white">BOB {{ fine.fineAmount | number:'1.2-2' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Observación -->
                <div *ngIf="payment.observation" class="mt-3 pt-3 border-t border-stroke dark:border-strokedark">
                  <p class="text-xs text-bodydark">
                    <span class="font-medium">Observación:</span> {{ payment.observation }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <app-button (click)="closeBillDetailModal()" [variant]="'secondary'">Cerrar</app-button>
          </div>
        </div>
      </div>
    </app-modal>
  `
})
export class BillsListComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Facturas de Agua', link: '/water-bills' }
  ];

  bills: WaterBillOutputDto[] = [];
  filteredBills: WaterBillOutputDto[] = [];

  // Filtros
  searchQuery = '';
  filterStatus = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Estados
  isLoading = true;
  errorMessage = '';
  showAlert = false;
  alertType: 'success' | 'error' | 'info' = 'success';
  alertMessage = '';

  // Modal de detalle
  showBillDetailModal = false;
  billDetail: WaterBillDetailDto | null = null;
  isLoadingBillDetail = false;

  constructor(
    private waterBillService: WaterBillService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.waterBillService.getAllBills().subscribe({
      next: (data) => {
        console.log('data bills START');
        console.log(data);
        console.log('data bills END');
        this.bills = data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.filteredBills = [...this.bills];
        this.calculatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.bills];

    // Filtro por búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(bill => 
        bill.partnerName.toLowerCase().includes(query) ||
        bill.billNumber.toLowerCase().includes(query) ||
        bill.waterConnectionNumber?.toLowerCase().includes(query)
      );
    }

    // Filtro por estado
    if (this.filterStatus) {
      filtered = filtered.filter(bill => bill.statusCode === this.filterStatus);
    }

    this.filteredBills = filtered;
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBills.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  get paginatedBills(): WaterBillOutputDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredBills.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get startEntry(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endEntry(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.filteredBills.length ? this.filteredBills.length : end;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) pages.push(i);
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) pages.push(i);
      }
    }
    
    return pages;
  }

  getPendingBillsCount(): number {
    return this.bills.filter(b => b.statusCode === 'PENDING' || b.statusCode === 'PARTIAL_PAID').length;
  }

  getTotalPending(): number {
    return this.bills.reduce((sum, bill) => sum + bill.remainingBalance, 0);
  }

  getBillStatusClass(status: string): string {
    const baseClass = 'inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium';
    switch (status) {
      case 'PAID':
        return `${baseClass} bg-success text-success`;
      case 'PENDING':
        return `${baseClass} bg-warning text-warning`;
      case 'OVERDUE':
        return `${baseClass} bg-danger text-danger`;
      case 'PARTIAL_PAID':
        return `${baseClass} bg-primary text-primary`;
      default:
        return `${baseClass} bg-gray text-gray`;
    }
  }

  formatBillingMonth(bill: WaterBillOutputDto): string {
    if (!bill.billingPeriodStart) {
      return '-';
    }
    
    try {
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      // billingPeriodStart viene en formato YYYY-MM-DD
      const dateParts = bill.billingPeriodStart.split('-');
      if (dateParts.length !== 3) {
        return '-';
      }
      
      const year = parseInt(dateParts[0], 10);
      const monthIndex = parseInt(dateParts[1], 10) - 1; // El mes viene en 1-12, convertimos a 0-11 para el array
      const day = parseInt(dateParts[2], 10);
      
      // Validar que los valores sean válidos
      if (isNaN(year) || isNaN(monthIndex) || isNaN(day) || monthIndex < 0 || monthIndex > 11) {
        return '-';
      }
      
      // Formato: "Diciembre 2025"
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const monthName = monthNames[monthIndex];
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      return `${capitalizedMonth} ${year}`;
    } catch (error) {
      console.error('Error formateando mes de facturación:', error, bill);
      return '-';
    }
  }

  navigateToGenerateBills(): void {
    this.router.navigate(['/water-bills/generate']);
  }

  viewBill(bill: WaterBillOutputDto): void {
    this.isLoadingBillDetail = true;
    this.showBillDetailModal = true;
    this.waterBillService.getBillDetailWithPayments(bill.id).subscribe({
      next: (detail) => {
        this.billDetail = detail;
        this.isLoadingBillDetail = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle de factura:', error);
        this.isLoadingBillDetail = false;
        this.showAlert = true;
        this.alertType = 'error';
        this.alertMessage = 'Error al cargar el detalle de la factura';
        this.showBillDetailModal = false;
      }
    });
  }

  closeBillDetailModal(): void {
    this.showBillDetailModal = false;
    this.billDetail = null;
  }

  formatBillingMonthFromDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const dateParts = dateStr.split('-');
      if (dateParts.length !== 3) return '-';
      const year = parseInt(dateParts[0], 10);
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return '-';
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const monthName = monthNames[monthIndex];
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return `${capitalizedMonth} ${year}`;
    } catch (error) {
      return '-';
    }
  }

  getTotalFinesPaid(): number {
    if (!this.billDetail) return 0;
    return this.billDetail.payments.reduce((total: number, payment) => {
      return total + (payment.paymentDetail?.finesAmount || 0);
    }, 0);
  }

  registerPayment(bill: WaterBillOutputDto): void {
    this.router.navigate(['/water-payments/add'], { queryParams: { billId: bill.id } });
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  getErrorMessage(error: any): string {
    if (error.status === 401) return 'Se requiere autenticación. Por favor inicia sesión.';
    if (error.status === 0) return 'No se puede conectar al servidor.';
    return 'Error al cargar las facturas.';
  }
}

