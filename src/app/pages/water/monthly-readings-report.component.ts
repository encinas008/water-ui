import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../shared/services/report.service';
import { MonthlyReadingsReportDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { toast } from 'ngx-sonner';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-monthly-readings-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './monthly-readings-report.component.html'
})
export class MonthlyReadingsReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Lecturas por Mes', link: '/reports/readings' }
    ];

    selectedYear: number;
    selectedMonth: number;
    report: MonthlyReadingsReportDto | null = null;
    isLoading = false;

    years: number[] = [];
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

    constructor(private reportService: ReportService) {
        const now = new Date();
        this.selectedYear = now.getFullYear();
        this.selectedMonth = now.getMonth() + 1;

        // Generar últimos 5 años
        for (let i = 0; i < 5; i++) {
            this.years.push(this.selectedYear - i);
        }
    }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;
        this.reportService.getMonthlyReadings(this.selectedYear, this.selectedMonth).subscribe({
            next: (data) => {
                this.report = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading readings:', error);
                toast.error('No se pudo cargar el reporte de lecturas');
                this.isLoading = false;
            }
        });
    }

    exportToExcel(): void {
        if (!this.report || this.report.readings.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data = this.report.readings.map(r => ({
            'Nro Socio': r.partnerNumber,
            'Nombre': r.partnerName,
            'Lectura': r.readingValue,
            'Fecha Realizada': r.readingDate
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Lecturas');

        const fileName = `Lecturas_${this.report.monthName}_${this.report.year}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success('Reporte exportado correctamente');
    }

    printReport(): void {
        window.print();
    }
}
