import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { WaterPaymentInputDto, WaterBillOutputDto, PaymentType, CashBalanceOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-add-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Registrar Pago'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800': alertType === 'success',
        'bg-red-50 text-red-800': alertType === 'error'
      }">
        <span>{{ alertMessage }}</span>
      </div>

      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Información del Pago</h3>
        </div>

        <form (ngSubmit)="onSubmit()" class="p-6.5">
          <!-- Información de la Factura -->
          <div *ngIf="selectedBill" class="mb-6 p-4 bg-gray-2 dark:bg-meta-4 rounded-lg">
            <h4 class="font-medium text-black dark:text-white mb-3">Factura Seleccionada</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><strong>N° Factura:</strong> {{ selectedBill.billNumber }}</div>
              <div><strong>Socio:</strong> {{ selectedBill.partnerName }}</div>
              <div><strong>Período:</strong> {{ selectedBill.billingPeriodStart | date:'dd/MM/yy' }} - {{ selectedBill.billingPeriodEnd | date:'dd/MM/yy' }}</div>
              <div><strong>Total:</strong> {{ selectedBill.totalAmount | currency:'USD':'symbol':'1.2-2' }}</div>
              <div><strong>Pagado:</strong> {{ selectedBill.paidAmount | currency:'USD':'symbol':'1.2-2' }}</div>
              <div><strong class="text-danger">Saldo:</strong> <span class="text-danger font-bold">{{ selectedBill.remainingBalance | currency:'USD':'symbol':'1.2-2' }}</span></div>
            </div>
          </div>

          <!-- Buscar Factura -->
          <div *ngIf="!selectedBill" class="mb-4.5">
            <label class="mb-2.5 block text-black dark:text-white">Buscar Factura <span class="text-meta-1">*</span></label>
            <div class="relative">
              <input type="text" [(ngModel)]="billSearch" name="billSearch" (input)="onBillSearch()"
                placeholder="Buscar por número de factura o nombre de socio..."
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
              
              <div *ngIf="showBillDropdown && filteredBills.length > 0" 
                   class="absolute z-10 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div *ngFor="let bill of filteredBills" (click)="selectBill(bill)"
                     class="p-3 hover:bg-gray-2 dark:hover:bg-meta-4 cursor-pointer border-b">
                  <p class="font-medium">{{ bill.billNumber }} - {{ bill.partnerName }}</p>
                  <p class="text-sm text-bodydark">Saldo: {{ bill.remainingBalance | currency:'USD':'symbol':'1.2-2' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="selectedBill">
            <!-- Fecha de Pago -->
            <div class="mb-4.5">
              <label class="mb-2.5 block text-black dark:text-white">Fecha de Pago <span class="text-meta-1">*</span></label>
              <input type="date" [(ngModel)]="paymentDate" name="paymentDate" required
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
            </div>

            <!-- Monto -->
            <div class="mb-4.5">
              <label class="mb-2.5 block text-black dark:text-white">Monto del Pago <span class="text-meta-1">*</span></label>
              <input type="number" step="0.01" [(ngModel)]="amount" name="amount" required
                [max]="selectedBill.remainingBalance"
                placeholder="Monto a pagar"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input" />
              <p class="mt-1 text-sm text-bodydark">Máximo: {{ selectedBill.remainingBalance | currency:'USD':'symbol':'1.2-2' }}</p>
            </div>

            <!-- Tipo de Pago -->
            <div class="mb-4.5">
              <label class="mb-2.5 block text-black dark:text-white">Método de Pago <span class="text-meta-1">*</span></label>
              <select [(ngModel)]="paymentTypeId" name="paymentType" required
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input">
                <option value="">Seleccione un método</option>
                <option *ngFor="let type of paymentTypes" [value]="type.id">{{ type.name }}</option>
              </select>
            </div>

            <!-- Balance de Caja -->
            <div class="mb-4.5">
              <label class="mb-2.5 block text-black dark:text-white">Balance de Caja</label>
              <select [(ngModel)]="cashBalanceId" name="cashBalanceId"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input">
                <option [value]="undefined">Sin balance de caja</option>
                <option *ngFor="let balance of openCashBalances" [value]="balance.id">
                  {{ balance.description || 'Balance sin descripción' }} - Abierto: {{ balance.openTime | date:'dd/MM/yyyy HH:mm' }}
                </option>
              </select>
              <p class="mt-1 text-sm text-bodydark">
                <span *ngIf="openCashBalances.length === 0" class="text-warning">
                  ⚠️ No hay balances de caja abiertos. El pago se registrará sin asociar a un balance.
                </span>
                <span *ngIf="openCashBalances.length > 0" class="text-success">
                  ✓ Balance de caja seleccionado automáticamente
                </span>
              </p>
            </div>

            <!-- Observaciones -->
            <div class="mb-6">
              <label class="mb-2.5 block text-black dark:text-white">Observaciones</label>
              <textarea [(ngModel)]="observation" name="observation" rows="3"
                placeholder="Observaciones sobre el pago..."
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"></textarea>
            </div>

            <!-- Botones -->
            <div class="flex gap-4">
              <app-button type="submit" [variant]="'primary'" [disabled]="isLoading || !isFormValid()">
                <span *ngIf="!isLoading">Registrar Pago</span>
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
export class AddPaymentComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Pagos', link: '/water-payments' },
    { label: 'Registrar Pago', link: '/water-payments/add' }
  ];

  billSearch = '';
  bills: WaterBillOutputDto[] = [];
  filteredBills: WaterBillOutputDto[] = [];
  selectedBill: WaterBillOutputDto | null = null;
  showBillDropdown = false;

  paymentDate = '';
  amount: number | null = null;
  paymentTypeId = '';
  cashBalanceId?: string;  // UUID opcional del balance de caja
  observation = '';  // Observaciones del pago

  paymentTypes: PaymentType[] = [];
  openCashBalances: CashBalanceOutputDto[] = [];
  isLoading = false;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';

  constructor(
    private waterPaymentService: WaterPaymentService,
    private waterBillService: WaterBillService,
    private authService: AuthService,
    private cashBalanceService: CashBalanceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.paymentDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadPaymentTypes();
    this.loadPendingBills();
    this.loadOpenCashBalance();
    
    // Si viene el billId desde query params, cargar esa factura
    this.route.queryParams.subscribe(params => {
      if (params['billId']) {
        this.loadBillById(params['billId']);
      }
    });
  }

  loadPaymentTypes(): void {
    this.waterPaymentService.getPaymentTypes().subscribe({
      next: (data) => this.paymentTypes = data,
      error: (error) => console.error('Error al cargar tipos de pago:', error)
    });
  }

  loadOpenCashBalance(): void {
    const userInfo = this.authService.getUserInfo();
    if (!userInfo || !userInfo.userId) {
      console.warn('No se pudo obtener userId para cargar balance de caja');
      return;
    }

    this.cashBalanceService.getLastOpenCashBalanceByUser(userInfo.userId).subscribe({
      next: (balances) => {
        this.openCashBalances = balances;
        // Si hay un balance abierto, asignarlo automáticamente
        if (balances.length > 0) {
          this.cashBalanceId = balances[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar balance de caja abierto:', error);
        // No mostrar error al usuario, solo log
      }
    });
  }

  loadPendingBills(): void {
    this.waterBillService.getPendingBills().subscribe({
      next: (data) => this.bills = data,
      error: (error) => console.error('Error al cargar facturas:', error)
    });
  }

  loadBillById(billId: string): void {
    this.waterBillService.getBillById(billId).subscribe({
      next: (bill) => {
        this.selectedBill = bill;
        this.amount = bill.remainingBalance;
      },
      error: (error) => console.error('Error al cargar factura:', error)
    });
  }

  onBillSearch(): void {
    const query = this.billSearch.toLowerCase().trim();
    if (query.length < 2) {
      this.filteredBills = [];
      this.showBillDropdown = false;
      return;
    }

    this.filteredBills = this.bills.filter(bill =>
      bill.billNumber.toLowerCase().includes(query) ||
      bill.partnerName.toLowerCase().includes(query)
    ).slice(0, 10);

    this.showBillDropdown = this.filteredBills.length > 0;
  }

  selectBill(bill: WaterBillOutputDto): void {
    this.selectedBill = bill;
    this.amount = bill.remainingBalance;
    this.showBillDropdown = false;
  }

  isFormValid(): boolean {
    return !!(
      this.selectedBill &&
      this.paymentDate &&
      this.amount && this.amount > 0 &&
      this.amount <= this.selectedBill.remainingBalance &&
      this.paymentTypeId
    );
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isLoading = true;

    // Obtener userId del usuario autenticado
    const userInfo = this.authService.getUserInfo();
    const userId = userInfo?.userId || undefined;

    const payment: WaterPaymentInputDto = {
      waterBillId: this.selectedBill!.id,
      partnerId: this.selectedBill!.partnerId,
      paymentDate: this.paymentDate,
      amount: this.amount!,
      paymentTypeId: this.paymentTypeId,
      userId: userId,
      cashBalanceId: this.cashBalanceId || undefined,
      observation: this.observation || undefined
    };

    this.waterPaymentService.createPayment(payment).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showAlertMessage('Pago registrado exitosamente', 'success');
        setTimeout(() => this.router.navigate(['/water-bills']), 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al registrar pago:', error);
        this.showAlertMessage(error.error?.message || 'Error al registrar el pago', 'error');
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

