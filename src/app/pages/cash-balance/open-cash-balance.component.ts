import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashBalanceInputDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-open-cash-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Abrir Balance de Caja'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>



      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Información del Balance de Caja</h3>
        </div>

        <form (ngSubmit)="onSubmit()" class="p-6.5">
          <!-- Información del usuario -->
          <div *ngIf="userInfo" class="mb-6 p-4 bg-gray-2 dark:bg-meta-4 rounded-lg">
            <h4 class="font-medium text-black dark:text-white mb-2">Usuario</h4>
            <p class="text-sm text-bodydark">{{ userInfo.name }} {{ userInfo.lastname }}</p>
          </div>

          <!-- Dinero inicial -->
          <div class="mb-4.5">
            <label class="mb-2.5 block text-black dark:text-white">
              Dinero Inicial para Abrir Caja <span class="text-meta-1">*</span>
            </label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              [(ngModel)]="moneyToOpenCashBalance" 
              name="moneyToOpenCashBalance" 
              required
              placeholder="0.00"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" 
            />
            <p class="mt-1 text-sm text-bodydark">Ingrese el monto inicial con el que se abrirá la caja</p>
          </div>

          <!-- Botones -->
          <div class="flex gap-4">
            <app-button type="submit" [variant]="'primary'" [disabled]="isLoading || !isFormValid()">
              <span *ngIf="!isLoading">Abrir Balance de Caja</span>
              <span *ngIf="isLoading">Abriendo...</span>
            </app-button>
            <app-button type="button" [variant]="'secondary'" (click)="onCancel()" [disabled]="isLoading">
              Cancelar
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class OpenCashBalanceComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Abrir Balance', link: '/cash-balances/open' }
  ];

  moneyToOpenCashBalance: number | null = null;
  userInfo: any = null;
  isLoading = false;

  constructor(
    private cashBalanceService: CashBalanceService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userInfo = this.authService.getUserInfo();
    if (!this.userInfo || !this.userInfo.userId) {
      toast.error('No se pudo obtener la información del usuario');
      this.router.navigate(['/cash-balances']);
    }
  }

  isFormValid(): boolean {
    return !!(this.moneyToOpenCashBalance && this.moneyToOpenCashBalance >= 0 && this.userInfo?.userId);
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isLoading = true;

    const cashBalanceInput: CashBalanceInputDto = {
      moneyToOpenCashBalance: this.moneyToOpenCashBalance!,
      userId: this.userInfo.userId
    };

    this.cashBalanceService.createCashBalance(cashBalanceInput).subscribe({
      next: (response) => {
        this.isLoading = false;
        toast.success('Balance de caja abierto exitosamente');
        this.router.navigate(['/cash-balances', response.id]);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al abrir balance de caja:', error);

        // El backend devuelve el mensaje directamente en error.error para BadRequestException
        let errorMessage = 'Error al abrir el balance de caja';
        if (error.error) {
          // Si error.error es un string, usarlo directamente
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
          // Si error.error es un objeto con message, usar message
          else if (error.error.message) {
            errorMessage = error.error.message;
          }
        }

        toast.error(errorMessage);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/cash-balances']);
  }


}

