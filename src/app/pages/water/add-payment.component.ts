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
import { WaterPaymentInputDto, WaterBillOutputDto, PaymentType, CashBalanceOutputDto, MonthlyPendingFinesDto, PaymentDetailDto, PaymentReceiptFullDto } from '../../shared/models/water-system.models';
import { PaymentReceiptPreviewComponent } from './payment-receipt-preview.component';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-add-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent, PaymentReceiptPreviewComponent],
  templateUrl: './add-payment.component.html',
  styles: ``
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

  // Pendientes del mes (trabajos/reuniones) - Siempre se incluyen
  pendingFines: MonthlyPendingFinesDto | null = null;
  isLoadingPendingFines = false;

  // Detalle del pago registrado
  registeredPaymentDetail: PaymentDetailDto | null = null;

  // Factura imprimible
  registeredPaymentId: string | null = null;
  showReceiptPreview = false;
  fullReceipt: PaymentReceiptFullDto | null = null;
  isLoadingReceipt = false;

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
        if (this.selectedBill) {
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
    if (this.pendingFines) {
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

    // Calcular monto máximo permitido (Factura + Multas)
    let maxAmount = this.selectedBill.remainingBalance;
    if (this.pendingFines) {
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
      includePendingFines: true
    };

    this.waterPaymentService.createPayment(payment).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Guardar detalle del pago para mostrarlo
        this.registeredPaymentDetail = response.paymentDetail || null;
        this.registeredPaymentId = response.id;

        // Mostrar detalle de pago si está disponible
        if (response.paymentDetail && response.paymentDetail.finesAmount > 0) {
          toast.success('Pago registrado exitosamente. Generando impresión...');
        } else {
          toast.success('Pago registrado exitosamente. Generando impresión...');
        }

        // Cargar factura completa
        // this.loadFullReceipt(response.id);

        // Imprimir directamente (PDF)
        this.downloadReceiptPdf();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al registrar pago:', error);
        toast.error(error.error?.message || 'Error al registrar el pago');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/water-bills']);
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

  loadFullReceipt(paymentId: string): void {
    this.isLoadingReceipt = true;
    this.waterPaymentService.getFullPaymentReceipt(paymentId).subscribe({
      next: (receipt) => {
        this.fullReceipt = receipt;
        this.isLoadingReceipt = false;
        this.showReceiptPreview = true;
      },
      error: (error) => {
        this.isLoadingReceipt = false;
        console.error('Error al cargar factura:', error);
        toast.error('Error al cargar la factura');
      }
    });
  }

  closeReceiptPreview(): void {
    this.showReceiptPreview = false;
  }

  downloadReceiptPdf(): void {
    if (!this.registeredPaymentId) return;

    this.isLoadingReceipt = true;
    this.waterPaymentService.downloadReceiptPdf(this.registeredPaymentId).then(() => {
      this.isLoadingReceipt = false;
      toast.success('Vista de impresión generada');
      // Redirigir al listado de facturas después de imprimir
      this.router.navigate(['/water-bills']);
    }).catch((error) => {
      this.isLoadingReceipt = false;
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar la vista de impresión');
    });
  }
}
