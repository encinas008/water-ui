import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { GenerateMonthlyBillsRequestDto, WaterBillGenerationPreviewDto, WaterBillPreviewItemDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-generate-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './generate-bills.component.html',
  styles: ``
})
export class GenerateBillsComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Facturas', link: '/water-bills' },
    { label: 'Generar Facturas', link: '/water-bills/generate' }
  ];

  generateMonth: number = new Date().getMonth() + 1;
  generateYear: number = new Date().getFullYear();
  currentMonthLimit: number = new Date().getMonth() + 1;

  months = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' }
  ];

  isLoadingPreview = false;
  isGenerating = false;
  previewData: WaterBillGenerationPreviewDto | null = null;

  constructor(private waterBillService: WaterBillService, private router: Router) {}

  ngOnInit(): void {}

  onPreview(): void {
    if (!this.generateMonth || !this.generateYear) {
      toast.error('Por favor completa el mes y año.');
      return;
    }

    this.isLoadingPreview = true;
    this.previewData = null;

    this.waterBillService.previewMonthlyBills(this.generateYear, this.generateMonth).subscribe({
      next: (data) => {
        this.previewData = data;
        this.isLoadingPreview = false;
        
        if (data.toGenerateCount === 0) {
          toast.warning('No hay socios con lecturas para el mes elegido.');
        } else {
          toast.success(`Se encontraron ${data.toGenerateCount} socios listos para facturar.`);
        }
      },
      error: (error) => {
        this.isLoadingPreview = false;
        console.error('Error al cargar la previsualización:', error);
        toast.error('Error al cargar la previsualización de facturas');
      }
    });
  }

  onGenerate(): void {
    if (!this.previewData || this.previewData.toGenerateCount === 0) {
      toast.error('No hay facturas para generar.');
      return;
    }

    const startOfMonth = new Date(this.generateYear, this.generateMonth - 1, 1);
    const endOfMonth = new Date(this.generateYear, this.generateMonth, 0);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const request: GenerateMonthlyBillsRequestDto = {
      billingPeriodStart: startOfMonth.getFullYear() + '-' + String(startOfMonth.getMonth() + 1).padStart(2, '0') + '-01',
      billingPeriodEnd: endOfMonth.getFullYear() + '-' + String(endOfMonth.getMonth() + 1).padStart(2, '0') + '-' + String(endOfMonth.getDate()).padStart(2, '0'),
      ratePerM3: 2.50,
      dueDate: dueDate.getFullYear() + '-' + String(dueDate.getMonth() + 1).padStart(2, '0') + '-' + String(dueDate.getDate()).padStart(2, '0')
    };

    this.isGenerating = true;

    this.waterBillService.generateMonthlyBills(request).subscribe({
      next: (bills: any[]) => {
        this.isGenerating = false;
        toast.success(`Se generaron ${bills.length} facturas exitosamente`);
        this.router.navigate(['/water-bills']);
      },
      error: (error) => {
        this.isGenerating = false;
        console.error('Error al generar facturas:', error);
        toast.error('Error al generar facturas');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/water-bills']);
  }
}
