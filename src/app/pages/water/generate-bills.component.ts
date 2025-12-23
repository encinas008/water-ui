import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { GenerateMonthlyBillsRequestDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-generate-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Generar Facturas Mensuales'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error'
      }">
        <span>{{ alertMessage }}</span>
      </div>

      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Configuración de Facturación</h3>
        </div>

        <form (ngSubmit)="onSubmit()" class="p-6.5">
          <div class="mb-4.5 flex flex-col gap-6 xl:flex-row">
            <div class="w-full xl:w-1/2">
              <label class="mb-2.5 block text-black dark:text-white">Fecha Inicio Período <span class="text-meta-1">*</span></label>
              <input type="date" [(ngModel)]="billingPeriodStart" name="start" required
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
            </div>
            <div class="w-full xl:w-1/2">
              <label class="mb-2.5 block text-black dark:text-white">Fecha Fin Período <span class="text-meta-1">*</span></label>
              <input type="date" [(ngModel)]="billingPeriodEnd" name="end" required
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
            </div>
          </div>

          <div class="mb-4.5 flex flex-col gap-6 xl:flex-row">
            <div class="w-full xl:w-1/2">
              <label class="mb-2.5 block text-black dark:text-white">Tarifa por m³ <span class="text-meta-1">*</span></label>
              <input type="number" step="0.01" [(ngModel)]="ratePerM3" name="rate" required placeholder="Ej: 2.50"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
            </div>
            <div class="w-full xl:w-1/2">
              <label class="mb-2.5 block text-black dark:text-white">Fecha de Vencimiento <span class="text-meta-1">*</span></label>
              <input type="date" [(ngModel)]="dueDate" name="due" required
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
            </div>
          </div>

          <div class="mb-4.5">
            <label class="mb-2.5 block text-black dark:text-white">Cargos Adicionales</label>
            <input type="number" step="0.01" [(ngModel)]="additionalCharges" name="charges" placeholder="0.00"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
          </div>

          <div class="mb-6">
            <label class="mb-2.5 block text-black dark:text-white">Notas</label>
            <textarea [(ngModel)]="notes" name="notes" rows="3" placeholder="Notas sobre la facturación..."
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"></textarea>
          </div>

          <div class="flex gap-4">
            <app-button type="submit" [variant]="'primary'" [disabled]="isLoading">
              <span *ngIf="!isLoading">Generar Facturas</span>
              <span *ngIf="isLoading">Generando...</span>
            </app-button>
            <app-button type="button" [variant]="'secondary'" (click)="onCancel()" [disabled]="isLoading">
              Cancelar
            </app-button>
          </div>
        </form>

        <div *ngIf="generationResult" class="p-6.5 border-t border-stroke dark:border-strokedark">
          <h4 class="mb-4 text-xl font-semibold text-black dark:text-white">Resultado de la Generación</h4>
          <div class="space-y-2">
            <p><strong>Facturas generadas:</strong> {{ generationResult.billsGenerated }}</p>
            <p><strong>Monto total:</strong> {{ generationResult.totalAmount | currency:'USD':'symbol':'1.2-2' }}</p>
            <div *ngIf="generationResult.errors.length > 0" class="mt-4">
              <p class="text-danger font-medium">Errores:</p>
              <ul class="list-disc pl-5">
                <li *ngFor="let error of generationResult.errors" class="text-sm text-danger">{{ error }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GenerateBillsComponent {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Facturas', link: '/water-bills' },
    { label: 'Generar Facturas', link: '/water-bills/generate' }
  ];

  billingPeriodStart = '';
  billingPeriodEnd = '';
  ratePerM3: number = 2.50;
  dueDate = '';
  additionalCharges: number = 0;
  notes = '';

  isLoading = false;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';
  generationResult: any = null;

  constructor(private waterBillService: WaterBillService, private router: Router) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const dueDay = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    
    this.billingPeriodStart = firstDay.toISOString().split('T')[0];
    this.billingPeriodEnd = lastDay.toISOString().split('T')[0];
    this.dueDate = dueDay.toISOString().split('T')[0];
  }

  onSubmit(): void {
    this.isLoading = true;
    this.generationResult = null;

    const request: GenerateMonthlyBillsRequestDto = {
      billingPeriodStart: this.billingPeriodStart,
      billingPeriodEnd: this.billingPeriodEnd,
      ratePerM3: this.ratePerM3,
      dueDate: this.dueDate,
      additionalCharges: this.additionalCharges || undefined,
      notes: this.notes || undefined
    };

    this.waterBillService.generateMonthlyBills(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.generationResult = response;
        this.showAlertMessage(`Se generaron ${response.billsGenerated} facturas exitosamente`, 'success');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al generar facturas:', error);
        this.showAlertMessage(error.error?.message || 'Error al generar facturas', 'error');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/water-bills']);
  }

  showAlertMessage(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }
}

