import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { PartnerService } from '../../shared/services/partner.service';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { WaterReadingService } from '../../shared/services/water-reading.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { WaterMeterReadingOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-water-dashboard',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './water-dashboard.component.html',
  styles: ``
})
export class WaterDashboardComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard de Agua', link: '/water-dashboard' }
  ];

  metrics = {
    totalPartners: 0,
    activeConnections: 0,
    pendingBills: 0,
    overdueBills: 0,
    totalDebt: 0,
    monthlyCollection: 0,
    readingsThisMonth: 0
  };

  overdueBills: any[] = [];
  topDebtors: any[] = [];
  isLoading = true;

  constructor(
    private partnerService: PartnerService,
    private waterBillService: WaterBillService,
    private waterReadingService: WaterReadingService,
    private waterPaymentService: WaterPaymentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Cargar partners - usar paginación con tamaño grande para obtener todos
    // Usamos un tamaño grande (10000) para obtener todos los partners en una sola página
    this.partnerService.getPartnersPaginated(0, 10000, '').subscribe({
      next: (pageResponse) => {
        const partners = pageResponse.content;
        this.metrics.totalPartners = pageResponse.totalElements;
        this.metrics.activeConnections = partners.filter(p => p.connectionStatusCode === 'ACTIVE').length;

        // Top deudores
        this.topDebtors = partners
          .filter(p => (p.currentDebt || 0) > 0)
          .sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0));

        this.metrics.totalDebt = this.topDebtors.reduce((sum, p) => sum + (p.currentDebt || 0), 0);
      },
      error: (error) => {
        console.error('Error al cargar partners:', error);
        // En caso de error, intentar con método alternativo si existe
        this.metrics.totalPartners = 0;
      }
    });

    // Cargar facturas - usar paginación con tamaño grande
    this.waterBillService.getBillsPaginated(0, 10000, '', '').subscribe({
      next: (pageResponse) => {
        const bills = pageResponse.content;
        this.metrics.pendingBills = bills.filter(b =>
          b.statusCode === 'PENDING' || b.statusCode === 'PARTIAL_PAID'
        ).length;

        this.overdueBills = bills
          .filter(b => b.statusCode === 'OVERDUE')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        this.metrics.overdueBills = this.overdueBills.length;
      },
      error: (error) => console.error('Error al cargar facturas:', error)
    });

    // Cargar lecturas del mes
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDateStr = firstDayOfMonth.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    this.waterReadingService.getReadingsByPeriod(startDateStr, endDateStr).subscribe({
      next: (readings: WaterMeterReadingOutputDto[]) => {
        this.metrics.readingsThisMonth = readings.length;
      },
      error: (error: any) => console.error('Error al cargar lecturas:', error)
    });

    // Cargar pagos del mes
    this.waterPaymentService.getAllPayments().subscribe({
      next: (payments) => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        this.metrics.monthlyCollection = payments
          .filter(p => new Date(p.paymentDate) >= firstDayOfMonth)
          .reduce((sum, p) => sum + p.amount, 0);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar pagos:', error);
        this.isLoading = false;
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}

