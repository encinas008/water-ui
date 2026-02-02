import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../shared/services/report.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { MissingReadingItemDto } from '../../shared/models/water-system.models';
import * as XLSX from 'xlsx';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-missing-readings-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './missing-readings-report.component.html'
})
export class MissingReadingsReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Lecturas Faltantes', link: '/reports/missing-readings' }
    ];

    partners: MissingReadingItemDto[] = [];
    isLoading = false;
    currentDate = new Date();

    selectedYear: number;
    selectedMonth: number;

    years: number[] = [];
    months = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' }
    ];

    constructor(private reportService: ReportService) {
        const today = new Date();
        this.selectedYear = today.getFullYear();
        this.selectedMonth = today.getMonth() + 1;

        // Generate last 5 years
        for (let i = 0; i < 5; i++) {
            this.years.push(this.selectedYear - i);
        }
    }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;
        this.reportService.getMissingReadingsReport(this.selectedYear, this.selectedMonth).subscribe({
            next: (data) => {
                this.partners = data;
                this.isLoading = false;
                if (data.length > 0) {
                    toast.success(`${data.length} socios sin lectura encontrados.`);
                } else {
                    toast.info('Todo al día. No faltan lecturas para este mes.');
                }
            },
            error: (error) => {
                console.error('Error:', error);
                toast.error('Error al cargar reporte.');
                this.isLoading = false;
            }
        });
    }

    printReport(): void {
        window.print();
    }

    exportToExcel(): void {
        if (this.partners.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data = this.partners.map(p => ({
            'N° Socio': p.partnerNumber,
            'Nombre': p.partnerName,
            'Medidor': p.waterMeterNumber || '-',
            'Lectura Anterior': p.previousReading || 0,
            'Fecha Lectura Ant.': p.previousReadingDate || 'N/A'
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Faltantes');

        const monthName = this.months.find(m => m.value == this.selectedMonth)?.label || '';
        const filename = `Lecturas_Faltantes_${monthName}_${this.selectedYear}.xlsx`;

        XLSX.writeFile(wb, filename);
    }
}
