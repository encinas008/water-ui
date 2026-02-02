import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportService } from '../../shared/services/report.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DebtReportDto } from '../../shared/models/water-system.models';
import * as XLSX from 'xlsx';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-cutoff-report',
    standalone: true,
    imports: [CommonModule, PageBreadcrumbComponent],
    templateUrl: './cutoff-report.component.html',
})
export class CutoffReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Candidatos a Corte', link: '/reports/cutoff-candidates' }
    ];

    candidates: DebtReportDto[] = [];
    isLoading = false;

    constructor(
        private reportService: ReportService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;


        this.reportService.getCutoffCandidatesReport().subscribe({
            next: (data) => {
                this.candidates = data;
                this.isLoading = false;
                if (data.length > 0) {
                    toast.success(`${data.length} candidatos a corte encontrados.`);
                } else {
                    toast.info('No hay candidatos a corte (con 4 o más facturas pendientes).');
                }
            },
            error: (error) => {
                console.error('Error cargando candidatos a corte:', error);
                toast.error('Error al cargar el reporte.');
                this.isLoading = false;
            }
        });
    }

    printReport(): void {
        window.print();
    }

    trackByPartnerId(index: number, item: DebtReportDto): string {
        return item.partnerId;
    }

    exportToExcel(): void {
        if (this.candidates.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data = this.candidates.map(c => ({
            'Nombre': c.partnerName,
            'Documento': c.partnerIdentificationNumber,
            'Celular': c.contactPhone || 'N/A',
            'Estado': c.connectionStatus,
            'Deuda Total': c.totalDebt,
            'Facturas Pendientes': c.pendingBillsCount,
            'Facturas Vencidas': c.overdueBillsCount
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cortes');

        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Reporte_Cortes_${timestamp}.xlsx`);
    }



    viewPartner(partnerId: string): void {
        this.router.navigate(['/partners', partnerId]);
    }
}
