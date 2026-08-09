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
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './partner-payments.component.html',
  styles: ``
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
  ) { }

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
          .filter(bill => bill.statusCode === 'PENDING')
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

