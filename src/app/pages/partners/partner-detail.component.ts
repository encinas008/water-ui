import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { PartnerService } from '../../shared/services/partner.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { PartnerOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-partner-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent
  ],
  templateUrl: './partner-detail.component.html',
  styles: ``
})
export class PartnerDetailComponent implements OnInit {
  partner: PartnerOutputDto | null = null;
  payments: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private partnerService: PartnerService,
    private waterPaymentService: WaterPaymentService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const partnerId = this.route.snapshot.paramMap.get('id');
    if (partnerId) {
      this.loadPartner(partnerId);
    } else {
      this.errorMessage = 'ID de socio no proporcionado';
      this.isLoading = false;
    }
  }

  loadPartner(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.partnerService.getPartnerById(id).subscribe({
      next: (data) => {
        this.partner = data;
        this.partner = data;
        this.loadPayments(id);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar socio:', error);

        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 404) {
          this.errorMessage = 'Socio no encontrado.';
        } else {
          this.errorMessage = `Error al cargar el socio: ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  onEdit(): void {
    if (this.partner?.id) {
      this.router.navigate(['/partners/edit', this.partner.id]);
    }
  }

  onDelete(): void {
    if (!this.partner?.id) return;

    if (confirm(`¿Estás seguro de que deseas eliminar a ${this.partner.fullName}?`)) {
      this.partnerService.deletePartner(this.partner.id).subscribe({
        next: () => {
          this.router.navigate(['/partners']);
        },
        error: (error) => {
          console.error('Error al eliminar socio:', error);
          alert('Error al eliminar el socio. Por favor intenta de nuevo.');
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/partners']);
  }

  getStatusColor(status: string | undefined): 'success' | 'warning' | 'error' | 'info' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'CUT_OFF':
        return 'error';
      case 'INACTIVE':
        return 'info';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'SUSPENDED':
        return 'Suspendida';
      case 'CUT_OFF':
        return 'Cortada';
      case 'INACTIVE':
        return 'Inactiva';
      default:
        return 'Sin estado';
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

  loadPayments(partnerId: string): void {
    this.waterPaymentService.getPaymentsByPartner(partnerId).subscribe({
      next: (data) => {
        this.payments = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar pagos:', error);
        this.isLoading = false;
      }
    });
  }

  onPrintReceipt(paymentId: string): void {
    if (confirm('¿Deseas imprimir este recibo?')) {
      this.waterPaymentService.downloadReceiptPdf(paymentId);
    }
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';

    const soloFecha = date.split(' ')[0]; // "2025-12-29"
    const [year, month, day] = soloFecha.split('-').map(Number);

    const d = new Date(year, month - 1, day);

    if (isNaN(d.getTime())) return 'N/A';

    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    return `${day} de ${months[month - 1]} ${year}`;
  }
}
