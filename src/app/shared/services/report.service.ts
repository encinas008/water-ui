import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailyMovementReportDto, MonthlyReadingsReportDto, PartnerStatusReportDto } from '../models/water-system.models';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) { }

    getDailyMovements(startDate: string, endDate: string, userId?: string): Observable<DailyMovementReportDto> {
        let params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        if (userId) {
            params = params.set('userId', userId);
        }

        return this.http.get<DailyMovementReportDto>(`${this.apiUrl}/movements`, { params });
    }

    getMonthlyReadings(year: number, month: number): Observable<MonthlyReadingsReportDto> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());

        return this.http.get<MonthlyReadingsReportDto>(`${this.apiUrl}/readings`, { params });
    }

    getPartnerStatusReport(): Observable<PartnerStatusReportDto> {
        return this.http.get<PartnerStatusReportDto>(`${this.apiUrl}/partners-status`);
    }

    getCutoffCandidatesReport(): Observable<import('../models/water-system.models').DebtReportDto[]> {
        return this.http.get<import('../models/water-system.models').DebtReportDto[]>(`${this.apiUrl}/cutoff-candidates`);
    }

    getMoraCandidatesReport(months: number = 3): Observable<import('../models/water-system.models').DebtReportDto[]> {
        const params = new HttpParams()
            .set('months', months.toString());
        return this.http.get<import('../models/water-system.models').DebtReportDto[]>(`${this.apiUrl}/mora-candidates`, { params });
    }

    getReadingObservationsReport(year: number, month: number): Observable<import('../models/water-system.models').ReadingObservationsReportDto> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());
        return this.http.get<import('../models/water-system.models').ReadingObservationsReportDto>(`${this.apiUrl}/reading-observations`, { params });
    }

    getMissingReadingsReport(year: number, month: number): Observable<import('../models/water-system.models').MissingReadingItemDto[]> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());
        return this.http.get<import('../models/water-system.models').MissingReadingItemDto[]>(`${this.apiUrl}/missing-readings`, { params });
    }

    getDashboardStats(year?: number): Observable<import('../models/water-system.models').DashboardStatsDto> {
        let params = new HttpParams();
        if (year) {
            params = params.set('year', year.toString());
        }
        return this.http.get<import('../models/water-system.models').DashboardStatsDto>(`${this.apiUrl}/dashboard-stats`, { params });
    }

    getExcessConsumptionReport(year: number, month: number, threshold?: number): Observable<import('../models/water-system.models').ExcessConsumptionReportDto> {
        let params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());
        if (threshold) {
            params = params.set('threshold', threshold.toString());
        }
        return this.http.get<import('../models/water-system.models').ExcessConsumptionReportDto>(`${this.apiUrl}/excess-consumption`, { params });
    }

    getPartnerConsumptionStats(partnerId: string, year?: number): Observable<import('../models/water-system.models').PartnerConsumptionStatsDto> {
        let params = new HttpParams();
        if (year) {
            params = params.set('year', year.toString());
        }
        return this.http.get<import('../models/water-system.models').PartnerConsumptionStatsDto>(`${this.apiUrl}/partner-consumption/${partnerId}`, { params });
    }

    getMonthlyBillsReport(year: number, month: number, status: string): Observable<import('../models/water-system.models').WaterBillOutputDto[]> {
        let params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());
        if (status && status !== 'ALL') {
            params = params.set('status', status);
        }
        return this.http.get<import('../models/water-system.models').WaterBillOutputDto[]>(`${this.apiUrl}/monthly-bills`, { params });
    }

    getIncomeReport(startDate: string, endDate: string): Observable<import('../models/water-system.models').IncomeReportDto> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<import('../models/water-system.models').IncomeReportDto>(`${this.apiUrl}/income`, { params });
    }

    getExpenseReport(startDate: string, endDate: string): Observable<import('../models/water-system.models').ExpenseReportDto> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<import('../models/water-system.models').ExpenseReportDto>(`${this.apiUrl}/expenses`, { params });
    }

    getWaivedReport(startDate: string, endDate: string): Observable<import('../models/water-system.models').WaivedReportDto> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<import('../models/water-system.models').WaivedReportDto>(`${this.apiUrl}/waived`, { params });
    }
}
