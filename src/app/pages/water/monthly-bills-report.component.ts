import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { ReportService } from '../../shared/services/report.service';
import { WaterBillOutputDto } from '../../shared/models/water-system.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-monthly-bills-report',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './monthly-bills-report.component.html'
})
export class MonthlyBillsReportComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Reportes', link: '/reports' },
        { label: 'Reporte Mensual de Facturas', link: '' }
    ];

    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth() + 1;

    selectedYear = this.currentYear;
    selectedMonth = this.currentMonth;
    selectedStatus = 'ALL';

    bills: WaterBillOutputDto[] = [];
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

    statusOptions = [
        { value: 'ALL', name: 'Todos los estados' },
        { value: 'PENDING', name: 'Pendientes' },
        { value: 'PAID', name: 'Pagadas' },
        { value: 'CANCELLED', name: 'Anuladas' },
        { value: 'OVERDUE', name: 'Vencidas' },
        { value: 'PARTIAL_PAID', name: 'Pago Parcial' }
    ];

    constructor(
        private reportService: ReportService
    ) {
        // Generate last 5 years
        for (let i = 0; i < 5; i++) {
            this.years.push(this.currentYear - i);
        }
    }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading = true;
        this.reportService.getMonthlyBillsReport(this.selectedYear, this.selectedMonth, this.selectedStatus)
            .subscribe({
                next: (data) => {
                    this.bills = data.map(bill => {
                        if (bill.statusCode === 'CANCELLED' || (bill.statusName && bill.statusName.toUpperCase() === 'CANCELADA')) {
                            bill.statusName = 'ANULADA';
                        }
                        return bill;
                    });
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error al cargar el reporte:', error);
                    toast.error('Error al cargar el reporte');
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

    getStatusName(statusCode: string): string {
        return this.statusOptions.find(s => s.value === statusCode)?.name || statusCode;
    }

    getTotalAmount(): number {
        return this.bills.reduce((sum, item) => sum + item.totalAmount, 0);
    }

    getTotalPaid(): number {
        return this.bills.reduce((sum, item) => sum + item.paidAmount, 0);
    }

    getTotalPending(): number {
        return this.bills.reduce((sum, item) => sum + item.remainingBalance, 0);
    }

    exportToExcel(): void {
        if (this.bills.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data = this.bills.map((item, index) => ({
            '#': index + 1,
            'Socio': item.partnerName,
            'Número de Socio': item.partnerNumber || 'N/A',
            'Nro Factura': item.billNumber,
            'Estado': item.statusName,
            'Consumo (m³)': item.consumptionM3,
            'Total (Bs)': item.totalAmount,
            'Pagado (Bs)': item.paidAmount,
            'Saldo (Bs)': item.remainingBalance,
            'Fecha Vencimiento': item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A',
            'Fecha Pago': item.paidDate ? new Date(item.paidDate).toLocaleDateString() : 'N/A'
        }));

        // Add total row
        data.push({
            '#': '',
            'Socio': 'TOTAL',
            'Número de Socio': '',
            'Nro Factura': '',
            'Estado': '',
            'Consumo (m³)': '',
            'Total (Bs)': this.getTotalAmount(),
            'Pagado (Bs)': this.getTotalPaid(),
            'Saldo (Bs)': this.getTotalPending(),
            'Fecha Vencimiento': '',
            'Fecha Pago': ''
        } as any);

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte Mensual');

        const fileName = `Reporte_Mensual_${this.getMonthName(this.selectedMonth)}_${this.selectedYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success('Reporte exportado correctamente');
    }

    printReport(): void {
        window.print();
    }
}
