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
import { WaterPaymentInputDto, WaterBillOutputDto, PaymentType, CashBalanceOutputDto, MonthlyPendingFinesDto, PaymentDetailDto } from '../../shared/models/water-system.models';

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
              <div><strong>Mes:</strong> {{ formatBillingMonth(selectedBill) }}</div>
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
                [readonly]="true"
                class="w-full rounded border-[1.5px] border-stroke bg-gray-2 dark:bg-meta-4 py-3 px-5 font-medium outline-none transition cursor-not-allowed dark:border-form-strokedark" />
            </div>

            <!-- Pendientes del Mes -->
            <div *ngIf="pendingFines && (pendingFines.jobAbsences.length > 0 || pendingFines.meetingAbsences.length > 0)" class="mb-4.5 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div class="mb-3">
                <h4 class="font-medium text-black dark:text-white">Multas Pendientes del Mes ({{ formatBillingMonth(selectedBill) }})</h4>
                <p class="text-sm text-bodydark mt-1">Las multas pendientes del mes de la factura se incluirán automáticamente en el pago</p>
              </div>
              
              <div *ngIf="isLoadingPendingFines" class="text-sm text-bodydark">
                Cargando pendientes...
              </div>
              
              <div *ngIf="!isLoadingPendingFines">
                <!-- Ausencias de Trabajos -->
                <div *ngIf="pendingFines.jobAbsences.length > 0" class="mb-3">
                  <p class="text-sm font-medium text-black dark:text-white mb-2">Ausencias de Trabajos:</p>
                  <div class="space-y-1">
                    <div *ngFor="let absence of pendingFines.jobAbsences" class="text-sm text-bodydark flex justify-between">
                      <span>{{ absence.name }} - {{ absence.date | date:'dd/MM/yyyy' }}</span>
                      <span class="font-medium">BOB {{ absence.fine | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Ausencias de Reuniones -->
                <div *ngIf="pendingFines.meetingAbsences.length > 0" class="mb-3">
                  <p class="text-sm font-medium text-black dark:text-white mb-2">Ausencias de Reuniones:</p>
                  <div class="space-y-1">
                    <div *ngFor="let absence of pendingFines.meetingAbsences" class="text-sm text-bodydark flex justify-between">
                      <span>{{ absence.name }} - {{ absence.date | date:'dd/MM/yyyy' }}</span>
                      <span class="font-medium">BOB {{ absence.fine | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-bold text-black dark:text-white">Total de Multas:</span>
                    <span class="text-lg font-bold text-yellow-600 dark:text-yellow-400">BOB {{ pendingFines.totalFines | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Monto -->
            <div class="mb-4.5">
              <label class="mb-2.5 block text-black dark:text-white">Monto del Pago <span class="text-meta-1">*</span></label>
              <input type="number" step="0.01" [(ngModel)]="amount" name="amount" required
                [max]="getMaxPaymentAmount()"
                [readonly]="true"
                placeholder="Monto a pagar"
                class="w-full rounded border-[1.5px] border-stroke bg-gray-2 dark:bg-meta-4 py-3 px-5 font-medium outline-none transition cursor-not-allowed dark:border-form-strokedark" />
              <p class="mt-1 text-sm text-bodydark">
                Máximo: BOB {{ getMaxPaymentAmount() | number:'1.2-2' }}
                <span *ngIf="pendingFines && pendingFines.totalFines > 0" class="text-yellow-600 dark:text-yellow-400">
                  (incluye BOB {{ pendingFines.totalFines | number:'1.2-2' }} en multas)
                </span>
              </p>
              
              <!-- Detalle de pago desglosado -->
              <div *ngIf="pendingFines && pendingFines.totalFines > 0" class="mt-3 p-3 bg-gray-2 dark:bg-meta-4 rounded-lg">
                <p class="text-sm font-medium text-black dark:text-white mb-2">Desglose del Pago:</p>
                <div class="text-sm text-bodydark space-y-1">
                  <div class="flex justify-between">
                    <span>Monto Factura:</span>
                    <span class="font-medium">BOB {{ (selectedBill?.remainingBalance || 0) | number:'1.2-2' }}</span>
                  </div>
                  <div *ngIf="pendingFines.jobAbsences.length > 0" class="ml-4 mt-1">
                    <p class="font-medium mb-1">Multas de Trabajos:</p>
                    <div *ngFor="let fine of pendingFines.jobAbsences" class="flex justify-between ml-2">
                      <span>{{ fine.name }} ({{ fine.date | date:'dd/MM/yyyy' }}):</span>
                      <span>BOB {{ fine.fine | number:'1.2-2' }}</span>
                    </div>
                  </div>
                  <div *ngIf="pendingFines.meetingAbsences.length > 0" class="ml-4 mt-1">
                    <p class="font-medium mb-1">Multas de Reuniones:</p>
                    <div *ngFor="let fine of pendingFines.meetingAbsences" class="flex justify-between ml-2">
                      <span>{{ fine.name }} ({{ fine.date | date:'dd/MM/yyyy' }}):</span>
                      <span>BOB {{ fine.fine | number:'1.2-2' }}</span>
                    </div>
                  </div>
                  <div class="flex justify-between pt-2 border-t border-stroke dark:border-strokedark mt-2">
                    <span class="font-bold">Total a Pagar:</span>
                    <span class="font-bold">BOB {{ getMaxPaymentAmount() | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
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
              <label class="mb-2.5 block text-black dark:text-white">Balance de Caja <span class="text-meta-1">*</span></label>
              <select [(ngModel)]="cashBalanceId" name="cashBalanceId" required
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input">
                <option value="">Seleccione un balance de caja</option>
                <option *ngFor="let balance of openCashBalances" [value]="balance.id">
                  {{ balance.description || 'Balance sin descripción' }} - Abierto: {{ balance.openTime | date:'dd/MM/yyyy HH:mm' }}
                </option>
              </select>
              <p class="mt-1 text-sm text-bodydark">
                <span *ngIf="openCashBalances.length === 0" class="text-warning">
                  ⚠️ No hay balances de caja abiertos. Es necesario abrir un balance de caja antes de registrar el pago.
                </span>
                <span *ngIf="openCashBalances.length > 0 && cashBalanceId" class="text-success">
                  ✓ Balance de caja seleccionado
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

      <!-- Detalle del Pago Registrado -->
      <div *ngIf="registeredPaymentDetail && registeredPaymentDetail.finesAmount > 0" class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Detalle del Pago Registrado</h3>
        </div>
        <div class="p-6.5">
          <div class="space-y-4">
            <!-- Monto de Factura -->
            <div class="flex justify-between items-center pb-3 border-b border-stroke dark:border-strokedark">
              <span class="text-black dark:text-white font-medium">Monto de Factura:</span>
              <span class="text-black dark:text-white font-bold">BOB {{ registeredPaymentDetail.billAmount | number:'1.2-2' }}</span>
            </div>

            <!-- Multas de Trabajos -->
            <div *ngIf="registeredPaymentDetail.jobFines.length > 0">
              <p class="text-sm font-medium text-black dark:text-white mb-2">Multas de Trabajos:</p>
              <div class="ml-4 space-y-1">
                <div *ngFor="let fine of registeredPaymentDetail.jobFines" class="flex justify-between text-sm text-bodydark">
                  <span>{{ fine.name }} ({{ fine.date | date:'dd/MM/yyyy' }}):</span>
                  <span class="font-medium">BOB {{ fine.fineAmount | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Multas de Reuniones -->
            <div *ngIf="registeredPaymentDetail.meetingFines.length > 0">
              <p class="text-sm font-medium text-black dark:text-white mb-2">Multas de Reuniones:</p>
              <div class="ml-4 space-y-1">
                <div *ngFor="let fine of registeredPaymentDetail.meetingFines" class="flex justify-between text-sm text-bodydark">
                  <span>{{ fine.name }} ({{ fine.date | date:'dd/MM/yyyy' }}):</span>
                  <span class="font-medium">BOB {{ fine.fineAmount | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="flex justify-between items-center pt-3 border-t border-stroke dark:border-strokedark">
              <span class="text-black dark:text-white font-bold text-lg">Total Pagado:</span>
              <span class="text-black dark:text-white font-bold text-lg">BOB {{ registeredPaymentDetail.totalAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="mt-4 flex gap-4">
            <app-button type="button" [variant]="'primary'" (click)="onCancel()">
              Volver a Facturas
            </app-button>
          </div>
        </div>
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

  // Pendientes del mes
  pendingFines: MonthlyPendingFinesDto | null = null;
  includePendingFines = true; // Siempre incluir multas pendientes
  isLoadingPendingFines = false;
  
  // Detalle del pago registrado
  registeredPaymentDetail: PaymentDetailDto | null = null;

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
        // El monto se calculará automáticamente cuando se carguen las multas pendientes
        this.amount = bill.remainingBalance;
        // Cargar pendientes del mes cuando se selecciona una factura
        this.loadPendingFines(bill.partnerId);
      },
      error: (error) => console.error('Error al cargar factura:', error)
    });
  }

  loadPendingFines(partnerId: string): void {
    if (!this.selectedBill) {
      return;
    }

    this.isLoadingPendingFines = true;
    
    // Obtener el mes y año de la factura (usar billingPeriodStart)
    // Parsear manualmente para evitar problemas de zona horaria
    const dateParts = this.selectedBill.billingPeriodStart.split('-');
    if (dateParts.length !== 3) {
      this.isLoadingPendingFines = false;
      return;
    }
    
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10); // El mes viene en formato 1-12, que es lo que necesita el backend

    this.waterPaymentService.getMonthlyPendingFines(partnerId, month, year).subscribe({
      next: (data) => {
        this.pendingFines = data;
        this.isLoadingPendingFines = false;
        // Calcular automáticamente el monto total incluyendo multas
        if (this.selectedBill && this.includePendingFines) {
          this.amount = this.selectedBill.remainingBalance + data.totalFines;
        }
      },
      error: (error) => {
        console.error('Error al cargar multas pendientes:', error);
        this.isLoadingPendingFines = false;
        // No mostrar error al usuario, solo log
      }
    });
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


  getMaxPaymentAmount(): number {
    if (!this.selectedBill) return 0;
    let max = this.selectedBill.remainingBalance;
    if (this.includePendingFines && this.pendingFines) {
      max += this.pendingFines.totalFines;
    }
    return max;
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
    this.billSearch = `${bill.billNumber} - ${bill.partnerName}`;
    this.showBillDropdown = false;
    // El monto se calculará automáticamente cuando se carguen las multas pendientes
    this.amount = bill.remainingBalance;
    // Cargar pendientes del mes cuando se selecciona una factura
    this.loadPendingFines(bill.partnerId);
  }

  isFormValid(): boolean {
    if (!this.selectedBill || !this.paymentDate || !this.amount || this.amount <= 0 || !this.paymentTypeId || !this.cashBalanceId) {
      return false;
    }
    
    // Calcular monto máximo permitido
    let maxAmount = this.selectedBill.remainingBalance;
    if (this.includePendingFines && this.pendingFines) {
      maxAmount += this.pendingFines.totalFines;
    }
    
    return this.amount <= maxAmount;
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
      cashBalanceId: this.cashBalanceId!,
      observation: this.observation || undefined,
      includePendingFines: this.includePendingFines
    };

    this.waterPaymentService.createPayment(payment).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Guardar detalle del pago para mostrarlo
        this.registeredPaymentDetail = response.paymentDetail || null;
        
        // Mostrar detalle de pago si está disponible
        if (response.paymentDetail && response.paymentDetail.finesAmount > 0) {
          this.showAlertMessage('Pago registrado exitosamente. Ver detalle abajo.', 'success');
        } else {
          this.showAlertMessage('Pago registrado exitosamente', 'success');
        }
        // No redirigir automáticamente para que el usuario pueda ver el detalle
        // setTimeout(() => this.router.navigate(['/water-bills']), 5000);
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

  buildPaymentDetailMessage(detail: PaymentDetailDto): string {
    let message = `\n\nDetalle del Pago:\n`;
    message += `- Monto Factura: BOB ${detail.billAmount.toFixed(2)}\n`;
    
    if (detail.jobFines.length > 0) {
      message += `\nMultas de Trabajos (${detail.jobFines.length}):\n`;
      detail.jobFines.forEach(fine => {
        message += `  • ${fine.name} (${new Date(fine.date).toLocaleDateString('es-ES')}): BOB ${fine.fineAmount.toFixed(2)}\n`;
      });
    }
    
    if (detail.meetingFines.length > 0) {
      message += `\nMultas de Reuniones (${detail.meetingFines.length}):\n`;
      detail.meetingFines.forEach(fine => {
        message += `  • ${fine.name} (${new Date(fine.date).toLocaleDateString('es-ES')}): BOB ${fine.fineAmount.toFixed(2)}\n`;
      });
    }
    
    message += `\nTotal Multas: BOB ${detail.finesAmount.toFixed(2)}\n`;
    message += `Total Pagado: BOB ${detail.totalAmount.toFixed(2)}`;
    
    return message;
  }
}

