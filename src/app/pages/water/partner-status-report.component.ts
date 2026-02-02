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

        let filtered = this.report.results;

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

        this.filteredPartners = filtered;
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

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estado de Socios');

        const fileName = `Reporte_Estado_Socios_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success('Reporte exportado correctamente');
    }

    printReport(): void {
        window.print();
    }
}
