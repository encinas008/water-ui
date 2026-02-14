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
      next: (data) => {
        this.paymentTypes = data;
        // Preseleccionar "EFECTIVO" por defecto
        const efectivoType = data.find(t => t.name.toUpperCase() === 'EFECTIVO');
        if (efectivoType) {
          this.paymentTypeId = efectivoType.id;
        } else if (data.length > 0) {
          // Si no encuentra "EFECTIVO", seleccionar el primero
          this.paymentTypeId = data[0].id;
        }
      },
      error: (error) => console.error('Error al cargar tipos de pago:', error)
    });
  }

  loadOpenCashBalance(): void {
    const userInfo = this.authService.getUserInfo();
    if (!userInfo || !userInfo.userId) {
      console.warn('No se pudo obtener userId para cargar balance de caja');
      return;
    }

    const isAdmin = userInfo.role?.toUpperCase() === 'ADMINISTRADOR';

    const obs = isAdmin
      ? this.cashBalanceService.getAllOpenCashBalances()
      : this.cashBalanceService.getLastOpenCashBalanceByUser(userInfo.userId);

    obs.subscribe({
      next: (balances) => {
        this.openCashBalances = balances;
        // Si hay un solo balance abierto, asignarlo automáticamente
        if (balances.length === 1) {
          this.cashBalanceId = balances[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar balance de caja abierto:', error);
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
        this.processSelectedBill(bill);
      },
      error: (error) => console.error('Error al cargar factura:', error)
    });
  }

  processSelectedBill(bill: WaterBillOutputDto): void {
    // Si la factura ya trae las multas y el total procesado desde el backend, usarlos directamente
    // Esto evita doble cobro y errores de redondeo o filtrado en el frontend
    if (bill.pendingFines) {
      this.isLoadingPendingFines = false; // Asegurar que no quede bloqueado de una carga anterior
      this.pendingFines = {
        partnerId: bill.partnerId,
        month: 0, // No se usa en el template
        year: 0,
        jobAbsences: bill.pendingFines.filter(f => f.type === 'JOB' || f.type === 'TRABAJO'),
        meetingAbsences: bill.pendingFines.filter(f => f.type === 'MEETING' || f.type === 'REUNION'),
        totalFines: bill.totalFinesAmount || 0
      };

      this.amount = bill.totalPayableAmount || (bill.remainingBalance + this.pendingFines.totalFines);
    } else {
      // Fallback: Si por alguna razón no vienen las multas, intentar cargarlas
      this.amount = bill.remainingBalance;
      this.loadPendingFines(bill.partnerId);
    }
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
        // Filtrar multas que ya están incluidas como conceptos en la factura para evitar cobro doble
        if (this.selectedBill && this.selectedBill.concepts && this.selectedBill.concepts.length > 0) {
          const billedFines = this.selectedBill.concepts.filter(c =>
            c.conceptName.toLowerCase().includes('multa')
          );

          const filteredJobs = data.jobAbsences.filter(fine => {
            const fineName = fine.name.toLowerCase().trim();
            return !billedFines.some(c => c.conceptName.toLowerCase().trim().includes(fineName));
          });

          const filteredMeetings = data.meetingAbsences.filter(fine => {
            const fineName = fine.name.toLowerCase().trim();
            return !billedFines.some(c => c.conceptName.toLowerCase().trim().includes(fineName));
          });

          this.pendingFines = {
            ...data,
            jobAbsences: filteredJobs,
            meetingAbsences: filteredMeetings,
            totalFines: filteredJobs.reduce((sum, f) => sum + f.fine, 0) +
              filteredMeetings.reduce((sum, f) => sum + f.fine, 0)
          };
        } else {
          this.pendingFines = data;
        }

        this.isLoadingPendingFines = false;

        // Calcular automáticamente el monto total incluyendo solo multas NO facturadas
        if (this.selectedBill) {
          this.amount = this.selectedBill.remainingBalance + (this.pendingFines?.totalFines || 0);
        }
      },
      error: (error) => {
        console.error('Error al cargar multas pendientes:', error);
        this.isLoadingPendingFines = false;
        // Si falla la carga de multas, mantener el saldo de la factura
        if (this.selectedBill) {
          this.amount = this.selectedBill.remainingBalance;
        }
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
    this.processSelectedBill(bill);
  }

  isFormValid(): boolean {
    const hasBill = !!this.selectedBill;
    const hasDate = !!this.paymentDate;
    const hasAmount = this.amount !== null && this.amount > 0;
    const hasPaymentType = !!this.paymentTypeId;
    const hasCashBalance = !!this.cashBalanceId;

    if (!hasBill || !hasDate || !hasAmount || !hasPaymentType || !hasCashBalance) {
      return false;
    }

    // Calcular monto máximo permitido (Factura + Multas)
    let maxAmount = this.selectedBill!.remainingBalance;
    if (this.pendingFines) {
      maxAmount += this.pendingFines.totalFines;
    }

    // Usar una pequeña tolerancia para errores de precisión decimal o redondear a 2 decimales
    const roundedAmount = Math.round(this.amount! * 100);
    const roundedMax = Math.round(maxAmount * 100);

    return roundedAmount <= roundedMax;
  }

  onSubmit(): void {
    this.isLoading = true;
    if (!this.isFormValid()) {
      this.isLoading = false;
      return;
    }

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
    // Si hay una factura seleccionada, volver con el número de socio como búsqueda para conveniencia
    if (this.selectedBill) {
      this.router.navigate(['/water-bills'], {
        queryParams: { search: this.selectedBill.partnerNumber || this.selectedBill.partnerName }
      });
    } else {
      this.router.navigate(['/water-bills']);
    }
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
      // Redirigir al listado de facturas después de imprimir con el número de socio como búsqueda
      if (this.selectedBill) {
        this.router.navigate(['/water-bills'], {
          queryParams: { search: this.selectedBill.partnerNumber || this.selectedBill.partnerName }
        });
      } else {
        this.router.navigate(['/water-bills']);
      }
    }).catch((error) => {
      this.isLoadingReceipt = false;
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar la vista de impresión');
    });
  }
}
