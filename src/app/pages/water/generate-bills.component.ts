import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { GenerateMonthlyBillsRequestDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-generate-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './generate-bills.component.html',
  styles: ``
})
export class GenerateBillsComponent {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Facturas', link: '/water-bills' },
    { label: 'Generar Facturas', link: '/water-bills/generate' }
  ];

  billingPeriodStart = '';
  billingPeriodEnd = '';
  ratePerM3: number = 2.50;
  dueDate = '';
  additionalCharges: number = 0;
  notes = '';

  isLoading = false;
  generationResult: any = null;

  constructor(private waterBillService: WaterBillService, private router: Router) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const dueDay = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    this.billingPeriodStart = firstDay.toISOString().split('T')[0];
    this.billingPeriodEnd = lastDay.toISOString().split('T')[0];
    this.dueDate = dueDay.toISOString().split('T')[0];
  }

  onSubmit(): void {
    this.isLoading = true;
    this.generationResult = null;

    const request: GenerateMonthlyBillsRequestDto = {
      billingPeriodStart: this.billingPeriodStart,
      billingPeriodEnd: this.billingPeriodEnd,
      ratePerM3: this.ratePerM3,
      dueDate: this.dueDate,
      additionalCharges: this.additionalCharges || undefined,
      notes: this.notes || undefined
    };

    this.waterBillService.generateMonthlyBills(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.generationResult = response;
        toast.success(`Se generaron ${response.billsGenerated} facturas exitosamente`);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al generar facturas:', error);
        toast.error(error.error?.message || 'Error al generar facturas');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/water-bills']);
  }


}

