import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../shared/services/report.service';
import { DailyMovementReportDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-daily-movements-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent, DatePickerComponent],
    templateUrl: './daily-movements-report.component.html'
})
export class DailyMovementReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Movimientos por Fecha', link: '/reports/movements' }
    ];

    startDate: string = '';
    endDate: string = '';
    report: DailyMovementReportDto | null = null;
    isLoading = false;

    constructor(private reportService: ReportService) {
        const today = new Date().toISOString().split('T')[0];
        this.startDate = today;
        this.endDate = today;
    }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        if (!this.startDate || !this.endDate) return;
        this.isLoading = true;
        this.reportService.getDailyMovements(this.startDate, this.endDate).subscribe({
            next: (data) => {
                this.report = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading movements:', error);
                toast.error('No se pudo cargar el reporte de movimientos');
                this.isLoading = false;
            }
        });
    }

    onStartDateChange(event: any): void {
        this.startDate = event.dateStr;
        this.loadReport();
    }

    onEndDateChange(event: any): void {
        this.endDate = event.dateStr;
        this.loadReport();
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
    }

    printReport(): void {
        window.print();
    }

    getIncomeConcepts() {
        return this.report?.concepts.filter(c => c.type === 'INGRESO') || [];
    }

    getExpenseConcepts() {
        return this.report?.concepts.filter(c => c.type === 'EGRESO') || [];
    }
}
