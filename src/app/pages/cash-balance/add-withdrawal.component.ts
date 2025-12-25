import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashFlowService } from '../../shared/services/cash-flow.service';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { PartnerService } from '../../shared/services/partner.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashFlowInputDto, CashBalanceOutputDto, PaymentType, CashFlowType } from '../../shared/models/water-system.models';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-add-withdrawal',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Registrar Retiro'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <!-- Alertas -->
      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error'
      }">
        <span>{{ alertMessage }}</span>
      </div>

      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Información del Retiro</h3>
        </div>

        <form (ngSubmit)="onSubmit()" class="p-6.5">
          <!-- Información del Balance de Caja -->
          <div *ngIf="selectedCashBalance" class="mb-6 p-4 bg-gray-2 dark:bg-meta-4 rounded-lg">
            <h4 class="font-medium text-black dark:text-white mb-3">Balance de Caja Seleccionado</h4>
            <div *ngIf="isLoadingDetails" class="text-sm text-bodydark">
              Cargando información del balance...
            </div>
            <div *ngIf="!isLoadingDetails" class="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Asignado a:</strong> {{ selectedCashBalance.assignee }}</div>
              <div><strong>Fecha Apertura:</strong> {{ selectedCashBalance.openTime | date:'dd/MM/yyyy HH:mm' }}</div>
              <div><strong>Dinero Inicial:</strong> BOB {{ selectedCashBalance.initialMoney | number:'1.2-2' }}</div>
              <div><strong>Estado:</strong> <span class="text-success font-medium">ABIERTO</span></div>
              <div *ngIf="cashBalanceDetails" class="col-span-2 pt-2 border-t border-stroke dark:border-strokedark">
                <strong>Total Disponible en Caja:</strong> 
                <span class="text-lg font-bold text-success">BOB {{ getMaxWithdrawalAmount() | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Seleccionar Balance de Caja -->
          <div *ngIf="!selectedCashBalance" class="mb-4.5">
            <label class="mb-2.5 block text-black dark:text-white">Balance de Caja <span class="text-meta-1">*</span></label>
            <select [(ngModel)]="cashBalanceId" name="cashBalanceId" required
              (change)="selectCashBalance()"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input">
              <option value="">Seleccione un balance de caja</option>
              <option *ngFor="let balance of openCashBalances" [value]="balance.id">
                {{ balance.description || 'Balance sin descripción' }} - Abierto: {{ balance.openTime | date:'dd/MM/yyyy HH:mm' }}
              </option>
            </select>
            <p class="mt-1 text-sm text-bodydark">
              <span *ngIf="openCashBalances.length === 0" class="text-warning">
                ⚠️ No hay balances de caja abiertos. Es necesario abrir un balance de caja antes de registrar un retiro.
              </span>
            </p>
          </div>

          <div *ngIf="selectedCashBalance">
            <!-- Monto del Retiro -->
            <div class="mb-4.5">
              <label class="mb-2.5 block text-black dark:text-white">
                Monto del Retiro <span class="text-meta-1">*</span>
              </label>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                [(ngModel)]="amount" 
                name="amount" 
                required
                placeholder="0.00"
                [max]="getMaxWithdrawalAmount()"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" 
              />
              <p class="mt-1 text-sm text-bodydark">
                Máximo disponible: BOB {{ getMaxWithdrawalAmount() | number:'1.2-2' }}
              </p>
            </div>

            <!-- Tipo de Pago (solo efectivo para retiros) -->
            <div class="mb-4.5">
              <label class="mb-2.5 block text-black dark:text-white">Tipo de Pago <span class="text-meta-1">*</span></label>
              <select [(ngModel)]="paymentTypeId" name="paymentType" required
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input">
                <option value="">Seleccione un tipo</option>
                <option *ngFor="let type of cashPaymentTypes" [value]="type.id">{{ type.name }}</option>
              </select>
              <p class="mt-1 text-sm text-bodydark">Los retiros se realizan únicamente en efectivo</p>
            </div>

            <!-- Descripción -->
            <div class="mb-6">
              <label class="mb-2.5 block text-black dark:text-white">Descripción <span class="text-meta-1">*</span></label>
              <textarea 
                [(ngModel)]="description" 
                name="description" 
                rows="3"
                required
                placeholder="Descripción del retiro (ej: Retiro para compra de materiales, Retiro para gastos operativos, etc.)"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"></textarea>
            </div>

            <!-- Botones -->
            <div class="flex gap-4">
              <app-button type="submit" [variant]="'primary'" [disabled]="isLoading || !isFormValid()">
                <span *ngIf="!isLoading">Registrar Retiro</span>
                <span *ngIf="isLoading">Registrando...</span>
              </app-button>
              <app-button type="button" [variant]="'secondary'" (click)="onCancel()" [disabled]="isLoading">
                Cancelar
              </app-button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddWithdrawalComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Registrar Retiro', link: '/cash-balances/withdrawal' }
  ];

  cashBalanceId = '';
  selectedCashBalance: CashBalanceOutputDto | null = null;
  cashBalanceDetails: any = null; // Para obtener el total disponible
  openCashBalances: CashBalanceOutputDto[] = [];
  amount: number | null = null;
  paymentTypeId = '';
  description = '';
  cashFlowTypeId = ''; // ID del tipo EGRESO
  cashPaymentTypes: PaymentType[] = []; // Solo tipos de pago en efectivo
  isLoadingDetails = false;

  isLoading = false;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';

  constructor(
    private cashFlowService: CashFlowService,
    private cashBalanceService: CashBalanceService,
    private waterPaymentService: WaterPaymentService,
    private partnerService: PartnerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOpenCashBalances();
    this.loadPaymentTypes();
    this.loadCashFlowTypes();
  }

  loadOpenCashBalances(): void {
    const userInfo = this.authService.getUserInfo();
    if (!userInfo || !userInfo.userId) {
      this.showAlertMessage('No se pudo obtener la información del usuario', 'error');
      return;
    }

    this.cashBalanceService.getLastOpenCashBalanceByUser(userInfo.userId).subscribe({
      next: (balances) => {
        this.openCashBalances = balances;
        // Si hay un balance abierto, seleccionarlo automáticamente
        if (balances.length > 0) {
          this.cashBalanceId = balances[0].id;
          this.selectCashBalance();
        }
      },
      error: (error) => {
        console.error('Error al cargar balance de caja abierto:', error);
        this.showAlertMessage('Error al cargar balances de caja abiertos', 'error');
      }
    });
  }

  loadPaymentTypes(): void {
    this.waterPaymentService.getPaymentTypes().subscribe({
      next: (types) => {
        // Filtrar solo tipos de pago en efectivo para retiros
        this.cashPaymentTypes = types.filter(type => 
          type.name.toUpperCase() === 'EFECTIVO' || 
          type.name.toUpperCase() === 'CASH'
        );
        
        // Si no hay tipos filtrados, usar todos (por si acaso)
        if (this.cashPaymentTypes.length === 0) {
          this.cashPaymentTypes = types;
        }
        
        // Seleccionar el primero por defecto si hay solo uno
        if (this.cashPaymentTypes.length === 1) {
          this.paymentTypeId = this.cashPaymentTypes[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de pago:', error);
        this.showAlertMessage('Error al cargar tipos de pago', 'error');
      }
    });
  }

  loadCashFlowTypes(): void {
    this.partnerService.getCommons().pipe(
      map(response => {
        const cashFlowTypes = response.cashFlowTypes || [];
        // Buscar el tipo EGRESO
        const egresoType = cashFlowTypes.find((cft: any) => 
          cft.name.toUpperCase() === 'EGRESO' || 
          cft.code.toUpperCase() === 'OUT' ||
          cft.code.toUpperCase() === 'EGRESO'
        );
        if (egresoType) {
          this.cashFlowTypeId = egresoType.id;
        } else {
          console.warn('No se encontró el tipo de flujo EGRESO');
        }
      })
    ).subscribe({
      error: (error) => {
        console.error('Error al cargar tipos de flujo de caja:', error);
      }
    });
  }

  selectCashBalance(): void {
    if (!this.cashBalanceId) {
      this.selectedCashBalance = null;
      this.cashBalanceDetails = null;
      return;
    }

    this.selectedCashBalance = this.openCashBalances.find(b => b.id === this.cashBalanceId) || null;
    
    // Cargar detalles del balance para obtener el total disponible
    if (this.selectedCashBalance) {
      this.loadCashBalanceDetails();
    }
  }

  loadCashBalanceDetails(): void {
    if (!this.cashBalanceId) return;
    
    this.isLoadingDetails = true;
    this.cashBalanceService.getCashBalanceDetails(this.cashBalanceId).subscribe({
      next: (details) => {
        this.cashBalanceDetails = details;
        this.isLoadingDetails = false;
      },
      error: (error) => {
        console.error('Error al cargar detalles del balance:', error);
        this.isLoadingDetails = false;
      }
    });
  }

  getMaxWithdrawalAmount(): number {
    if (!this.cashBalanceDetails) {
      // Si aún no se cargaron los detalles, retornar 0
      return 0;
    }
    // El máximo disponible es el totalCashInBox
    return this.cashBalanceDetails.cashBalanceDetails?.totalCashInBox || 0;
  }

  isFormValid(): boolean {
    return !!(
      this.cashBalanceId &&
      this.amount &&
      this.amount > 0 &&
      this.paymentTypeId &&
      this.description.trim() &&
      this.cashFlowTypeId
    );
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    const userInfo = this.authService.getUserInfo();
    if (!userInfo || !userInfo.userId) {
      this.showAlertMessage('No se pudo obtener la información del usuario', 'error');
      return;
    }

    this.isLoading = true;

    const withdrawal: CashFlowInputDto = {
      paymentTypeId: this.paymentTypeId,
      cashFlowTypeId: this.cashFlowTypeId,
      amount: this.amount!,
      description: this.description.trim(),
      userId: userInfo.userId
    };

    this.cashFlowService.createCashFlow(withdrawal).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showAlertMessage('Retiro registrado exitosamente', 'success');
        setTimeout(() => {
          this.router.navigate(['/cash-balances', this.cashBalanceId]);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al registrar retiro:', error);
        
        let errorMessage = 'Error al registrar el retiro';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        }
        
        this.showAlertMessage(errorMessage, 'error');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/cash-balances']);
  }

  showAlertMessage(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }
}

