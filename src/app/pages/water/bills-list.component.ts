import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { WaterBillOutputDto, WaterBillDetailDto, BillStatus, PageResponse } from '../../shared/models/water-system.models';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import Swal from 'sweetalert2';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../shared/services/auth.service';

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
  filterStatus = 'PENDING';
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

  // Modal agregar concepto (Solo SUPER_ADMIN)
  showAddConceptModal = false;
  isSavingConcept = false;
  selectedBillForConcept: WaterBillOutputDto | null = null;
  newConceptData = {
    conceptName: '',
    amount: 0,
    assignedDate: new Date().toISOString().split('T')[0]
  };



  constructor(
    private waterBillService: WaterBillService,
    private waterPaymentService: WaterPaymentService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Suscribirse a cambios en los parámetros de consulta para búsqueda inicial
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
    });

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

    this.waterBillService.getBillStats(this.searchQuery, this.filterStatus).subscribe({
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
      case 'CANCELLED':
        return 'error';
      default:
        return 'info';
    }
  }

  get isSuperAdmin(): boolean {
    const userInfo = this.authService.getUserInfo();
    const role = userInfo?.role?.trim().toUpperCase() || '';
    const normalized = role.replace(/\s+/g, '_');
    return normalized === 'SUPER_ADMIN' || normalized === 'SUPER_ADMINISTRADOR';
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

  onCancelBill(bill: WaterBillOutputDto): void {
    const userInfo = this.authService.getUserInfo();
    const userId = userInfo ? userInfo.userId || userInfo.id : null;

    if (!userId) {
      toast.error('Sesión no válida. Por favor inicia sesión nuevamente.');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas anular la factura ${bill.billNumber}? Si está pagada, se registrará un retiro en caja. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, anular factura',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.waterBillService.cancelBill(bill.id, userId).subscribe({
          next: () => {
            toast.success('Factura anulada exitosamente');
            this.resetAndLoadBills();
          },
          error: (error) => {
            this.isLoading = false;
            console.error('❌ Error al anular factura:', error);

            let message = 'Error al anular la factura';
            if (error.error) {
              if (typeof error.error === 'string') {
                message = error.error;
              } else if (error.error.message) {
                message = error.error.message;
              }
            }

            toast.error(message);
          }
        });
      }
    });
  }

  reprintPayment(paymentId: string): void {
    this.isLoadingReprint = true;
    this.waterPaymentService.downloadReceiptPdf(paymentId, true).then(() => {
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

  getFilterStatusName(): string {
    switch (this.filterStatus) {
      case 'PENDING':
        const amountStr = this.totalPendingAmount > 0 ? ` - BOB ${this.totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
        return `PENDIENTES${amountStr}`;
      case 'PAID': return 'PAGADAS';
      case 'PARTIAL_PAID': return 'PAGOS PARCIALES';
      case 'OVERDUE': return 'VENCIDAS';
      case 'CANCELLED': return 'ANULADAS';
      default: return 'TODAS LAS FACTURAS';
    }
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return '?';

    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  getAvatarColor(name: string | undefined): string {
    if (!name) return 'bg-gray-500';

    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  openAddConceptModal(bill: WaterBillOutputDto): void {
    this.selectedBillForConcept = bill;
    this.newConceptData = {
      conceptName: '',
      amount: 0,
      assignedDate: new Date().toISOString().split('T')[0]
    };
    this.showAddConceptModal = true;
  }

  closeAddConceptModal(): void {
    this.showAddConceptModal = false;
    this.selectedBillForConcept = null;
  }

  submitNewConcept(): void {
    if (!this.selectedBillForConcept || !this.newConceptData.conceptName || this.newConceptData.amount <= 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    this.isSavingConcept = true;
    this.waterBillService.addConcept(this.selectedBillForConcept.id, this.newConceptData).subscribe({
      next: (updatedBill) => {
        toast.success('Concepto agregado exitosamente');
        this.isSavingConcept = false;
        this.showAddConceptModal = false;

        // Actualizar la factura en la lista local para reflejar el nuevo total
        const index = this.bills.findIndex(b => b.id === updatedBill.id);
        if (index !== -1) {
          this.bills = [
            ...this.bills.slice(0, index),
            updatedBill,
            ...this.bills.slice(index + 1)
          ];
        }

        // Recargar estadísticas para actualizar el monto pendiente total si corresponde
        this.waterBillService.getBillStats(this.searchQuery, this.filterStatus).subscribe({
          next: (stats) => {
            this.totalPendingAmount = stats.totalPendingAmount;
            this.pendingBillsCount = stats.pendingBillsCount;
          }
        });
      },
      error: (error) => {
        console.error('Error al agregar concepto:', error);
        toast.error('Error al agregar el concepto a la factura');
        this.isSavingConcept = false;
      }
    });
  }




  onDeleteConcept(bill: WaterBillOutputDto, conceptId: string): void {
    if (!this.isSuperAdmin || bill.statusCode !== 'PENDING') return;

    Swal.fire({
      title: '¿Eliminar concepto?',
      text: 'El monto total de la factura y la deuda del socio serán actualizados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.waterBillService.deleteConcept(bill.id, conceptId).subscribe({
          next: (updatedBill) => {
            toast.success('Concepto eliminado exitosamente');

            // 1. Actualizar el modal de detalle si está abierto
            if (this.billDetail && this.billDetail.bill.id === updatedBill.id) {
              this.billDetail = {
                ...this.billDetail,
                bill: updatedBill
              };
            }

            // 2. Actualizar la factura en la lista principal
            const index = this.bills.findIndex(b => b.id === updatedBill.id);
            if (index !== -1) {
              this.bills = [
                ...this.bills.slice(0, index),
                updatedBill,
                ...this.bills.slice(index + 1)
              ];
            }

            // 3. Recargar estadísticas
            this.waterBillService.getBillStats(this.searchQuery, this.filterStatus).subscribe({
              next: (stats) => {
                this.totalPendingAmount = stats.totalPendingAmount;
                this.pendingBillsCount = stats.pendingBillsCount;
              }
            });
          },
          error: (error) => {
            console.error('Error al eliminar concepto:', error);
            toast.error('No se pudo eliminar el concepto');
          }
        });
      }
    });
  }
}

