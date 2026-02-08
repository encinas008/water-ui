import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { ReportService } from '../../shared/services/report.service';
import { BillingConfigService } from '../../shared/services/billing-config.service';
import { ExcessConsumptionReportDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
    selector: 'app-excess-consumption-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './excess-consumption-report.component.html'
})
export class ExcessConsumptionReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Reportes', link: '/reports' },
        { label: 'Exceso de Consumo', link: '' }
    ];

    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth() + 1;

    selectedYear = this.currentYear;
    selectedMonth = this.currentMonth;
    threshold = 15;

    report?: ExcessConsumptionReportDto;
    isLoading = false;

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

    years: number[] = [];

    constructor(
        private reportService: ReportService,
        private billingConfigService: BillingConfigService
    ) {
        // Generate last 5 years
        for (let i = 0; i < 5; i++) {
            this.years.push(this.currentYear - i);
        }
    }

    ngOnInit(): void {
        // Cargar el umbral desde TARIFA_BASICA (que incluye consumo hasta 15 m³)
        this.billingConfigService.getAllConfigs().subscribe({
            next: (configs) => {
                const tarifaBasicaConfig = configs.find(c => c.configKey === 'TARIFA_BASICA');
                if (tarifaBasicaConfig) {
                    this.threshold = tarifaBasicaConfig.configValue;
                }
                this.loadReport();
            },
            error: (error) => {
                console.error('Error al cargar configuración, usando valor por defecto:', error);
                this.loadReport();
            }
        });
    }

    loadReport(): void {
        this.isLoading = true;
        this.reportService.getExcessConsumptionReport(this.selectedYear, this.selectedMonth, this.threshold)
            .subscribe({
                next: (data) => {
                    this.report = data;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error al cargar el reporte:', error);
                    this.isLoading = false;
                }
            });
    }

    onFilterChange(): void {
        this.loadReport();
    }

    getMonthName(month: number): string {
        return this.months.find(m => m.value === month)?.name || '';
    }

    exportToExcel(): void {
        if (!this.report || this.report.items.length === 0) {
            return;
        }

        const data = this.report.items.map((item, index) => ({
            '#': index + 1,
            'Socio': item.partnerName,
            'Número de Socio': item.partnerNumber,
            'Lectura Inicial (m³)': item.initialReading,
            'Lectura Final (m³)': item.finalReading,
            'Consumo Total (m³)': item.consumption,
            'Exceso (m³)': item.excess,
            'Fecha Lectura': new Date(item.readingDate).toLocaleDateString()
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Exceso de Consumo');

        const fileName = `Reporte_Exceso_Consumo_${this.getMonthName(this.selectedMonth)}_${this.selectedYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    printReport(): void {
        window.print();
    }
}
