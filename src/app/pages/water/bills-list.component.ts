import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { WaterBillOutputDto, WaterBillDetailDto, BillStatus, PageResponse } from '../../shared/models/water-system.models';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-bills-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
    ModalComponent,
    ScrollingModule,
  ],
  templateUrl: './bills-list.component.html',
  styleUrls: ['./bills-list.component.css']

})
export class BillsListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Facturas de Agua', link: '/water-bills' }
  ];

  bills: WaterBillOutputDto[] = [];
  totalElements: number = 0;

  // Filtros
  searchQuery = '';
  filterStatus = '';
  private searchSubject = new Subject<string>();
  private filterStatusSubject = new Subject<string>();

  // Paginación
  currentPage: number = 0; // Backend pages are 0-indexed
  pageSize: number = 20;
  totalPages: number = 0;
  isLoadingMore: boolean = false;

  // Stats
  totalPendingAmount: number = 0;
  pendingBillsCount: number = 0;

  // Estados
  isLoading = true;
  isLoadingReprint = false;
  errorMessage = '';
  hasMoreData: boolean = true;
  showAlert = false;
  alertType: 'success' | 'error' | 'info' = 'success';
  alertMessage = '';

  // Modal de detalle
  showBillDetailModal = false;
  billDetail: WaterBillDetailDto | null = null;
  isLoadingBillDetail = false;

  constructor(
    private waterBillService: WaterBillService,
    private waterPaymentService: WaterPaymentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.resetAndLoadBills();
    });

    this.filterStatusSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(statusCode => {
      this.resetAndLoadBills();
    });

    this.loadBills();
  }

  loadBills(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasMoreData = true;
    this.currentPage = 0; // Start from the first page

    this.waterBillService.getBillsPaginated(this.currentPage, this.pageSize, this.searchQuery, this.filterStatus).subscribe({
      next: (response: PageResponse<WaterBillOutputDto>) => {
        this.bills = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });

    this.waterBillService.getBillStats().subscribe({
      next: (stats) => {
        this.totalPendingAmount = stats.totalPendingAmount;
        this.pendingBillsCount = stats.pendingBillsCount;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  loadMoreBills(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMoreData) {
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    this.waterBillService.getBillsPaginated(this.currentPage, this.pageSize, this.searchQuery, this.filterStatus).subscribe({
      next: (response: PageResponse<WaterBillOutputDto>) => {
        this.bills = [...this.bills, ...response.content];
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error al cargar más facturas:', error);
        this.isLoadingMore = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onFilterChange(): void {
    this.filterStatusSubject.next(this.filterStatus);
  }

  resetAndLoadBills(): void {
    this.bills = [];
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
    this.hasMoreData = true;
    this.loadBills();
  }

  onScrolledIndexChange(index: number): void {
    // Cargar más datos cuando el usuario se acerca al final de la lista
    if (this.viewport && index > this.bills.length - this.pageSize / 2) {
      this.loadMoreBills();
    }
  }

  getPendingBillsCount(): number {
    return this.pendingBillsCount;
  }

  getTotalPending(): number {
    return this.totalPendingAmount;
  }

  getBillStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      case 'PARTIAL_PAID':
        return 'info';
      default:
        return 'info';
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

      return `${capitalizedMonth} ${year} `;
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
      return `${capitalizedMonth} ${year} `;
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

  onReprintBill(bill: WaterBillOutputDto): void {
    this.isLoadingReprint = true;
    this.waterBillService.getBillDetailWithPayments(bill.id).subscribe({
      next: (detail) => {
        if (detail.payments.length === 0) {
          this.showAlertMessage('No hay pagos registrados para esta factura', 'error');
          this.isLoadingReprint = false;
        } else if (detail.payments.length === 1) {
          // Si solo hay un pago, reimprimir directamente
          this.reprintPayment(detail.payments[0].id);
        } else {
          // Si hay más de uno, abrir el modal para que el usuario elija
          this.billDetail = detail;
          this.showBillDetailModal = true;
          this.isLoadingReprint = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar pagos para reimpresión:', error);
        this.showAlertMessage('Error al cargar los pagos', 'error');
        this.isLoadingReprint = false;
      }
    });
  }

  reprintPayment(paymentId: string): void {
    this.isLoadingReprint = true;
    this.waterPaymentService.downloadReceiptPdf(paymentId).then(() => {
      this.isLoadingReprint = false;
      this.showAlertMessage('Recibo generado exitosamente', 'success');
    }).catch((error) => {
      console.error('Error al reimprimir:', error);
      this.showAlertMessage('Error al generar el PDF', 'error');
      this.isLoadingReprint = false;
    });
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.alertMessage = message;
    this.alertType = type as 'success' | 'error';
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }

  formatCurrency(amount: number): string {
    return `BOB ${amount.toFixed(2)} `;
  }

  getErrorMessage(error: any): string {
    if (error.status === 401) return 'Se requiere autenticación. Por favor inicia sesión.';
    if (error.status === 0) return 'No se puede conectar al servidor.';
    return 'Error al cargar las facturas.';
  }
}

