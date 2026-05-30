import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../shared/services/report.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ReadingObservationItemDto, ReadingObservationsReportDto } from '../../shared/models/water-system.models';
import * as XLSX from 'xlsx';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-reading-observations-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './reading-observations-report.component.html'
})
export class ReadingObservationsReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Observaciones de Lecturas', link: '/reports/reading-observations' }
    ];

    partners: ReadingObservationItemDto[] = [];
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
        this.reportService.getReadingObservationsReport(this.selectedYear, this.selectedMonth).subscribe({
            next: (data: ReadingObservationsReportDto) => {
                this.partners = data.items;
                this.isLoading = false;
                if (data.items.length > 0) {
                    toast.success(`${data.items.length} lecturas con observación encontradas.`);
                } else {
                    toast.info('No hay lecturas con observaciones para este mes.');
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
            'Lectura': p.readingValue || 0,
            'Consumo': p.consumption || 0,
            'Fecha Lectura': p.readingDate || 'N/A',
            'Observación': p.observation || '',
            'Registrado Por': p.readerUserName || 'Sistema'
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Faltantes');

        const monthName = this.months.find(m => m.value == this.selectedMonth)?.label || '';
        const filename = `Lecturas_Faltantes_${monthName}_${this.selectedYear}.xlsx`;

        XLSX.writeFile(wb, filename);
    }
}
