import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportService } from '../../shared/services/report.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DebtReportDto } from '../../shared/models/water-system.models';
import * as XLSX from 'xlsx';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-mora-report',
    standalone: true,
    imports: [CommonModule, PageBreadcrumbComponent],
    templateUrl: './mora-report.component.html',
})
export class MoraReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Socios en Mora', link: '/reports/mora-candidates' }
    ];

    candidates: DebtReportDto[] = [];
    isLoading = false;
    currentDate = new Date();

    constructor(
        private reportService: ReportService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;

        this.reportService.getMoraCandidatesReport(3).subscribe({
            next: (data) => {
                this.candidates = data;
                this.isLoading = false;
                if (data.length > 0) {
                    toast.success(`${data.length} socios en mora encontrados.`);
                } else {
                    toast.info('No hay socios en mora (con 3 o más facturas pendientes).');
                }
            },
            error: (error) => {
                console.error('Error cargando socios en mora:', error);
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
            'N° Socio': c.partnerNumber || 'N/A',
            'Socio': c.partnerName,
            'Documento': c.partnerIdentificationNumber,
            'Celular': c.contactPhone || 'N/A',
            'Estado': this.getStatusLabel(c.connectionStatus),
            'Deuda Total': c.totalDebt,
            'Cant. Facturas': c.pendingBillsCount,
            'Meses Pendientes': c.pendingMonths || ''
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Listado_Mora');

        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Reporte_Socios_Mora_${timestamp}.xlsx`);
        toast.success('Reporte exportado correctamente');
    }

    viewPartner(partnerId: string): void {
        this.router.navigate(['/partners', partnerId]);
    }

    getStatusLabel(status: string): string {
        const s = status?.toUpperCase();
        if (s?.includes('ACTIV')) return 'Activa';
        if (s?.includes('CORT')) return 'Cortada';
        if (s?.includes('SUSP')) return 'Suspendida';
        if (s?.includes('INACT')) return 'Inactiva';
        return status;
    }

    getStatusClass(status: string): string {
        const s = status?.toUpperCase();

        if (s?.includes('CORT')) {
            return 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-200 dark:bg-rose-500/80 dark:border-rose-400';
        }
        if (s?.includes('ACTIV')) {
            return 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-200 dark:bg-emerald-500/80 dark:border-emerald-400';
        }
        if (s?.includes('SUSP')) {
            return 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm shadow-amber-100 dark:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/50';
        }
        if (s?.includes('INACT')) {
            return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }

        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
}
