import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { PaymentReceiptPreviewComponent } from './payment-receipt-preview.component';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { PartnerService } from '../../shared/services/partner.service';
import { WaterBillOutputDto, PartnerOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-partner-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent, PaymentReceiptPreviewComponent],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Cobros de Agua'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <!-- Alertas -->
      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error'
      }">
        <span>{{ alertMessage }}</span>
      </div>

      <!-- Buscar Socio -->
      <div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Buscar Socio</h3>
        </div>
        <div class="p-6.5">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="partnerSearch"
              (input)="onPartnerSearch()"
              (focus)="onInputFocus()"
              placeholder="Buscar socio por nombre, documento o número de conexión..."
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            />
            
            <!-- Dropdown de resultados -->
            <div *ngIf="showPartnerDropdown && filteredPartners.length > 0" 
                 class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div *ngFor="let partner of filteredPartners" 
                   (mousedown)="selectPartner(partner)"
                   class="p-3 hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer border-b">
                <p class="font-medium">{{ partner.fullName }}</p>
                <p class="text-sm text-bodydark">{{ partner.partnerIdentificationNumber }}</p>
                <p class="text-sm text-bodydark">{{ partner.waterConnectionNumber }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Meses Pendientes -->
      <div *ngIf="selectedPartner" class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">Meses Pendientes de Pago</h3>
        </div>
        <div class="p-6.5">
          <div *ngIf="isLoadingBills" class="flex justify-center py-10">
            <div class="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>

          <table *ngIf="!isLoadingBills && pendingBills.length > 0" class="w-full table-auto">
            <thead>
              <tr class="bg-gray-2 text-left dark:bg-meta-4">
                <th class="py-4 px-4 font-medium text-black dark:text-white">FECHA</th>
                <th class="py-4 px-4 font-medium text-black dark:text-white text-right">MONTO (BS)</th>
                <th class="py-4 px-4 font-medium text-black dark:text-white text-center">COBRAR MES</th>
                <th class="py-4 px-4 font-medium text-black dark:text-white text-center">VISTA PREVIA</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of pendingBills" class="border-b border-[#eee] dark:border-strokedark">
                <td class="py-5 px-4">
                  <p class="text-black dark:text-white font-medium">{{ formatMonth(bill.billingPeriodStart) }}</p>
                </td>
                <td class="py-5 px-4 text-right">
                  <p class="text-black dark:text-white font-medium">{{ bill.totalAmount | number:'1.2-2' }}</p>
                </td>
                <td class="py-5 px-4 text-center">
                  <input
                    type="checkbox"
                    [checked]="isBillSelected(bill.id)"
                    (change)="toggleBillSelection(bill.id)"
                    class="h-5 w-5 rounded border-stroke text-primary focus:ring-2"
                  />
                </td>
                <td class="py-5 px-4 text-center">
                  <button
                    (click)="previewReceipt(bill)"
                    class="text-primary hover:text-primary/80 font-medium"
                  >
                    Vista Previa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="!isLoadingBills && pendingBills.length === 0" class="py-10 text-center text-bodydark">
            No hay meses pendientes de pago
          </div>

          <!-- Botones de acción -->
          <div *ngIf="selectedBills.length > 0" class="mt-6 flex gap-4">
            <app-button (click)="processPayments()" [variant]="'primary'" [disabled]="isProcessing">
              <span *ngIf="!isProcessing">Cobrar Meses Seleccionados ({{ selectedBills.length }})</span>
              <span *ngIf="isProcessing">Procesando...</span>
            </app-button>
            <app-button (click)="clearSelection()" [variant]="'secondary'">
              Limpiar Selección
            </app-button>
          </div>
        </div>
      </div>

      <!-- Vista Previa del Recibo -->
      <div *ngIf="showReceiptPreview && previewBill" class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <app-payment-receipt-preview
          [bill]="previewBill"
          [partner]="selectedPartner"
          [receiptType]="'NOTA DE PAGO'"
          (close)="closeReceiptPreview()"
        ></app-payment-receipt-preview>
      </div>
    </div>
  `
})
export class PartnerPaymentsComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Cobros de Agua', link: '/water-payments/partner' }
  ];

  // Búsqueda de socio
  partnerSearch = '';
  partners: PartnerOutputDto[] = [];
  filteredPartners: PartnerOutputDto[] = [];
  selectedPartner: PartnerOutputDto | null = null;
  showPartnerDropdown = false;

  // Facturas pendientes
  pendingBills: WaterBillOutputDto[] = [];
  selectedBills: string[] = [];
  isLoadingBills = false;

  // Vista previa
  showReceiptPreview = false;
  previewBill: WaterBillOutputDto | null = null;

  // Estados
  isProcessing = false;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';

  constructor(
    private waterBillService: WaterBillService,
    private waterPaymentService: WaterPaymentService,
    private partnerService: PartnerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPartners();
    
    // Si viene partnerId desde query params, cargar ese socio
    this.route.queryParams.subscribe(params => {
      if (params['partnerId']) {
        this.loadPartnerById(params['partnerId']);
      }
    });
  }

  loadPartners(): void {
    this.partnerService.getPartners().subscribe({
      next: (data) => {
        this.partners = data.filter(p => p.waterConnectionNumber);
      },
      error: (error) => console.error('Error al cargar socios:', error)
    });
  }

  loadPartnerById(partnerId: string): void {
    this.partnerService.getPartnerById(partnerId).subscribe({
      next: (partner) => {
        this.selectPartner(partner);
      },
      error: (error) => console.error('Error al cargar socio:', error)
    });
  }

  onPartnerSearch(): void {
    const query = this.partnerSearch.toLowerCase().trim();
    if (query.length < 2) {
      this.filteredPartners = [];
      this.showPartnerDropdown = false;
      return;
    }

    this.filteredPartners = this.partners.filter(partner =>
      partner.fullName.toLowerCase().includes(query) ||
      partner.partnerIdentificationNumber.toLowerCase().includes(query) ||
      partner.waterConnectionNumber?.toLowerCase().includes(query)
    ).slice(0, 10);

    this.showPartnerDropdown = this.filteredPartners.length > 0;
  }

  onInputFocus(): void {
    if (this.partnerSearch.length >= 2) {
      this.onPartnerSearch();
    }
  }

  selectPartner(partner: PartnerOutputDto): void {
    this.selectedPartner = partner;
    this.partnerSearch = partner.fullName;
    this.showPartnerDropdown = false;
    this.loadPendingBills(partner.id);
  }

  loadPendingBills(partnerId: string): void {
    this.isLoadingBills = true;
    this.waterBillService.getBillsByPartner(partnerId).subscribe({
      next: (bills) => {
        // Filtrar solo facturas pendientes
        this.pendingBills = bills
          .filter(bill => bill.statusCode === 'PENDING' || bill.statusCode === 'PARTIAL_PAID')
          .sort((a, b) => new Date(a.billingPeriodStart).getTime() - new Date(b.billingPeriodStart).getTime());
        this.isLoadingBills = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.isLoadingBills = false;
      }
    });
  }

  formatMonth(dateString: string): string {
    const date = new Date(dateString);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  isBillSelected(billId: string): boolean {
    return this.selectedBills.includes(billId);
  }

  toggleBillSelection(billId: string): void {
    const index = this.selectedBills.indexOf(billId);
    if (index > -1) {
      this.selectedBills.splice(index, 1);
    } else {
      this.selectedBills.push(billId);
    }
  }

  clearSelection(): void {
    this.selectedBills = [];
  }

  previewReceipt(bill: WaterBillOutputDto): void {
    this.previewBill = bill;
    this.showReceiptPreview = true;
  }

  closeReceiptPreview(): void {
    this.showReceiptPreview = false;
    this.previewBill = null;
  }

  processPayments(): void {
    if (this.selectedBills.length === 0) return;

    this.isProcessing = true;
    // TODO: Implementar lógica de procesamiento de pagos múltiples
    // Por ahora, redirigir a la página de pago individual
    if (this.selectedBills.length === 1) {
      this.router.navigate(['/water-payments/add'], { 
        queryParams: { billId: this.selectedBills[0] } 
      });
    } else {
      this.showAlertMessage('Procesamiento de múltiples pagos próximamente', 'info');
      this.isProcessing = false;
    }
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.alertMessage = message;
    this.alertType = type as 'success' | 'error';
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }
}

