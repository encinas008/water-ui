import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { DetailedDebtorsReportDto, DetailedDebtItemDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { toast } from 'ngx-sonner';
import * as XLSX from 'xlsx';

export interface GroupedDebt {
    partnerId: string;
    partnerNumber: string;
    partnerName: string;
    items: DetailedDebtItemDto[];
    partnerTotal: number;
}

@Component({
    selector: 'app-debtors-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './debtors-report.component.html'
})
export class DebtorsReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Reportes', link: '#' },
        { label: 'Deudores Detallado', link: '/reports/debtors' }
    ];

    report: DetailedDebtorsReportDto | null = null;
    allGroupedItems: GroupedDebt[] = [];
    filteredGroupedItems: GroupedDebt[] = [];
    isLoading = false;
    searchQuery = '';

    constructor(
        private waterBillService: WaterBillService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;
        this.waterBillService.getDebtorsReport().subscribe({
            next: (data) => {
                this.report = data;
                this.allGroupedItems = this.groupItems(data.items);
                this.applyFilter();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar reporte de deudores:', error);
                toast.error('No se pudo cargar el reporte');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private groupItems(items: DetailedDebtItemDto[]): GroupedDebt[] {
        const grouped: { [key: string]: GroupedDebt } = {};
        const order: string[] = [];

        items.forEach(item => {
            const key = item.partnerId;
            if (!grouped[key]) {
                grouped[key] = {
                    partnerId: item.partnerId,
                    partnerNumber: item.partnerNumber,
                    partnerName: item.partnerName,
                    items: [],
                    partnerTotal: 0
                };
                order.push(key);
            }
            grouped[key].items.push(item);
            grouped[key].partnerTotal += item.amount;
        });

        return order.map(key => grouped[key]);
    }

    onSearch(): void {
        this.applyFilter();
    }

    applyFilter(): void {
        const query = this.searchQuery.toLowerCase().trim();
        if (!query) {
            this.filteredGroupedItems = this.allGroupedItems;
        } else {
            this.filteredGroupedItems = this.allGroupedItems.filter(group =>
                group.partnerName.toLowerCase().includes(query) ||
                group.partnerNumber.toString().includes(query)
            );
        }

        const uiSum = this.getTotalFilteredDebt();
        console.log(`📊 [REPORTE] Suma de SUBTOTAL SOCIO en UI: Bs ${uiSum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`);
        console.log(`👥 [REPORTE] Socios deudores listados: ${this.filteredGroupedItems.length}`);
    }

    getTotalFilteredDebt(): number {
        return this.filteredGroupedItems.reduce((sum, group) => sum + group.partnerTotal, 0);
    }

    getUniquePartnersCount(): number {
        return this.filteredGroupedItems.length;
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
    }

    formatMonthYear(dateStr: string): string {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr + 'T12:00:00');
            const months = [
                'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
            ];
            return `${months[date.getMonth()]} ${date.getFullYear()}`;
        } catch (e) {
            return dateStr;
        }
    }

    printReport(): void {
        window.print();
    }

    exportToExcel(): void {
        if (this.filteredGroupedItems.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data: any[] = [];

        // Add Header Row
        data.push(['CÓDIGO', 'NOMBRE DEL SOCIO', 'FECHA', 'RAZÓN / CONCEPTO', 'MONTO (BS)']);
        data.push([]); // Empty row for spacing

        this.filteredGroupedItems.forEach(group => {
            group.items.forEach((item, index) => {
                data.push([
                    index === 0 ? group.partnerNumber : '',
                    index === 0 ? group.partnerName : '',
                    this.formatMonthYear(item.date),
                    item.concept,
                    item.amount
                ]);
            });
            // Subtotal for the partner
            data.push(['', '', '', `TOTAL SOCIO #${group.partnerNumber}`, group.partnerTotal]);
            data.push([]); // Spacer
        });

        // Global Total
        data.push([]);
        data.push(['', '', '', 'MONTO TOTAL PENDIENTE COMUNIDAD:', this.getTotalFilteredDebt()]);

        // Create workbook and worksheet
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Deudores Detallado');

        // Set column widths
        const wscols = [
            { wch: 10 }, // Código
            { wch: 40 }, // Nombre
            { wch: 15 }, // Fecha
            { wch: 50 }, // Concepto
            { wch: 15 }  // Monto
        ];
        ws['!cols'] = wscols;

        // Generate Excel file and trigger download
        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Reporte_Deudores_Detallado_${timestamp}.xlsx`);

        toast.success('Reporte exportado a Excel correctamente');
    }
}
