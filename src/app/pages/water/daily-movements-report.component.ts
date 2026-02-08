import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../shared/services/report.service';
import { DailyMovementReportDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { toast } from 'ngx-sonner';
import * as XLSX from 'xlsx';

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
                if (this.report && !this.report.generatedAt) {
                    this.report.generatedAt = new Date().toISOString();
                }
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

    exportToExcel(): void {
        if (!this.report) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data: any[] = [];
        data.push(['RESUMEN DE MOVIMIENTOS']);
        data.push([`Periodo: ${this.startDate} al ${this.endDate}`]);
        data.push([]);

        // Ingresos
        data.push(['INGRESOS']);
        data.push(['Concepto', 'Tipo', 'Monto (BS)']);
        this.getIncomeConcepts().forEach(c => {
            data.push([c.name, c.isManual ? 'Manual' : 'Sistema', c.amount]);
        });
        data.push(['TOTAL INGRESOS', '', this.report.totalIncome]);
        data.push([]);

        // Egresos
        data.push(['EGRESOS']);
        data.push(['Concepto', 'Tipo', 'Monto (BS)']);
        this.getExpenseConcepts().forEach(c => {
            data.push([c.name, 'Manual', c.amount]);
        });
        data.push(['TOTAL EGRESOS', '', this.report.totalExpense]);
        data.push([]);

        // Resumen Final
        data.push(['RESUMEN FINAL']);
        data.push(['Total Ingresos', this.report.totalIncome]);
        data.push(['Total Egresos', this.report.totalExpense]);
        data.push(['SALDO NETO', this.report.grandTotal]);

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

        // Column widths
        ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];

        XLSX.writeFile(wb, `Resumen_Movimientos_${this.startDate}_${this.endDate}.xlsx`);
        toast.success('Reporte exportado correctamente');
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
