import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../shared/services/report.service';
import { PartnerStatusReportDto, PartnerStatusItemDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { toast } from 'ngx-sonner';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-partner-status-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './partner-status-report.component.html'
})
export class PartnerStatusReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Estado de Socios', link: '/reports/partners-status' }
    ];

    report: PartnerStatusReportDto | null = null;
    filteredPartners: PartnerStatusItemDto[] = [];
    isLoading = false;
    selectedStatus: string = 'ALL';
    searchQuery: string = '';
    onlyWithDebt: boolean = false;
    currentDate: Date = new Date();
    sortColumn: string = 'partnerNumber';
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor(private reportService: ReportService) { }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;
        this.reportService.getPartnerStatusReport().subscribe({
            next: (data) => {
                this.report = data;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading partner status report:', error);
                toast.error('No se pudo cargar el reporte de estado de socios');
                this.isLoading = false;
            }
        });
    }

    applyFilters(): void {
        if (!this.report) return;

        let filtered = this.report.items;

        if (this.selectedStatus !== 'ALL') {
            filtered = filtered.filter(p => p.statusName === this.selectedStatus);
        }

        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.fullName.toLowerCase().includes(query) ||
                p.partnerNumber?.toString().includes(query) ||
                p.identificationNumber?.toLowerCase().includes(query)
            );
        }

        if (this.onlyWithDebt) {
            filtered = filtered.filter(p => (p.currentDebt || 0) > 0);
        }

        this.filteredPartners = this.sortData(filtered);
    }

    toggleSort(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.applyFilters();
    }

    private sortData(data: PartnerStatusItemDto[]): PartnerStatusItemDto[] {
        return [...data].sort((a, b) => {
            const valA = (a as any)[this.sortColumn];
            const valB = (b as any)[this.sortColumn];

            if (valA === valB) return 0;

            const multiplier = this.sortDirection === 'asc' ? 1 : -1;

            if (typeof valA === 'string') {
                return valA.localeCompare(valB) * multiplier;
            }

            return (valA - valB) * multiplier;
        });
    }

    getTotalDebt(): number {
        return this.filteredPartners.reduce((acc, p) => acc + (p.currentDebt || 0), 0);
    }

    getStatusList(): string[] {
        if (!this.report) return [];
        return Object.keys(this.report.statusSummary);
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
    }

    exportToExcel(): void {
        if (this.filteredPartners.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data = this.filteredPartners.map(p => ({
            'Nro Socio': p.partnerNumber,
            'Nombre Completo': p.fullName,
            'CI/NIT': p.identificationNumber,
            'Estado': p.statusName,
            'Deuda Actual': p.currentDebt,
            'Dirección': p.address
        }));

        // Añadir fila de totales
        data.push({
            'Nro Socio': null as any,
            'Nombre Completo': 'TOTAL' as any,
            'CI/NIT': '' as any,
            'Estado': '' as any,
            'Deuda Actual': this.getTotalDebt() as any,
            'Dirección': '' as any
        });


        const fileName = `Reporte_Estado_Socios_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Add info about filters at the top of the sheet
        const filterInfo = [
            ['REPORTE DE ESTADO DE SOCIOS'],
            [`Fecha: ${new Date().toLocaleString()}`],
            [`Estado: ${this.selectedStatus === 'ALL' ? 'Todos' : this.selectedStatus}`],
            [`Solo con deuda: ${this.onlyWithDebt ? 'Sí' : 'No'}`],
            [''],
        ];

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(filterInfo);
        XLSX.utils.sheet_add_json(ws, data, { origin: 'A6' });

        // Ajustar anchos de columna básicos
        const wscols = [
            { wch: 10 }, // Nro Socio
            { wch: 40 }, // Nombre Completo
            { wch: 15 }, // CI/NIT
            { wch: 15 }, // Estado
            { wch: 15 }, // Deuda Actual
            { wch: 50 }, // Dirección
        ];
        ws['!cols'] = wscols;

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estado de Socios');

        XLSX.writeFile(wb, fileName);
        toast.success('Reporte exportado correctamente');
    }

    printReport(): void {
        window.print();
    }
}
