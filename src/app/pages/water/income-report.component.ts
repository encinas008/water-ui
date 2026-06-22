import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../shared/services/report.service';
import { IncomeReportDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { toast } from 'ngx-sonner';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-income-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent, DatePickerComponent],
    templateUrl: './income-report.component.html'
})
export class IncomeReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Reporte de Ingresos', link: '/reports/income' }
    ];

    report: IncomeReportDto | null = null;
    isLoading = false;
    
    // Default to current month
    startDate: string = '';
    endDate: string = '';

    constructor(
        private reportService: ReportService,
        private cdr: ChangeDetectorRef
    ) { 
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        this.startDate = this.formatDateForApi(firstDay);
        this.endDate = this.formatDateForApi(lastDay);
    }

    ngOnInit(): void {
        this.loadReport();
    }

    private formatDateForApi(date: Date): string {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    onStartDateChange(event: any): void {
        if (event && event.dateStr) {
            this.startDate = event.dateStr;
        }
    }

    onEndDateChange(event: any): void {
        if (event && event.dateStr) {
            this.endDate = event.dateStr;
        }
    }

    loadReport(): void {
        if (!this.startDate || !this.endDate) {
            toast.error('Debe seleccionar fechas de inicio y fin');
            return;
        }

        this.isLoading = true;
        this.reportService.getIncomeReport(this.startDate, this.endDate).subscribe({
            next: (data) => {
                this.report = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar reporte de ingresos:', error);
                toast.error('No se pudo cargar el reporte');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr + 'T12:00:00');
            const day = date.getDate().toString().padStart(2, '0');
            const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateStr;
        }
    }

    printReport(): void {
        window.print();
    }

    exportToExcel(): void {
        if (!this.report || this.report.items.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data: any[] = [];

        // Add Header Row
        data.push(['Nº', 'FECHA', 'NOMBRE SOCIO', 'Nº DE SOCIO', 'TARIFA BÁSICA', 'APORTE OTB', 'APORTE DEPORTE', 'OTROS', 'TOTAL', 'RESPONSABLE']);
        data.push([]); // Spacer

        this.report.items.forEach((item) => {
            data.push([
                item.nro,
                this.formatDate(item.fecha),
                item.nombreSocio,
                item.numeroSocio,
                item.tarifaBasica,
                item.aporteOtb,
                item.aporteDeporte,
                item.otros,
                item.total,
                item.responsable
            ]);
        });

        // Global Total
        data.push([]);
        data.push(['', '', '', '', '', '', '', 'TOTAL INGRESOS:', this.report.totalIncome, '']);

        // Create workbook and worksheet
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Ingresos');

        // Set column widths
        const wscols = [
            { wch: 8 },  // Nº
            { wch: 15 }, // Fecha
            { wch: 40 }, // Nombre Socio
            { wch: 15 }, // Nº Socio
            { wch: 15 }, // Tarifa
            { wch: 15 }, // OTB
            { wch: 15 }, // Deporte
            { wch: 15 }, // Otros
            { wch: 15 }, // Total
            { wch: 20 }  // Responsable
        ];
        ws['!cols'] = wscols;

        // Generate Excel file and trigger download
        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Reporte_Ingresos_${timestamp}.xlsx`);

        toast.success('Reporte exportado a Excel correctamente');
    }
}
