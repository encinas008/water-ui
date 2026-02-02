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

    getDailyMovements(startDate: string, endDate: string): Observable<DailyMovementReportDto> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

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

    getMissingReadingsReport(year: number, month: number): Observable<import('../models/water-system.models').MissingReadingItemDto[]> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());
        return this.http.get<import('../models/water-system.models').MissingReadingItemDto[]>(`${this.apiUrl}/missing-readings`, { params });
    }
}
