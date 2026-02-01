import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import {
  WaterBillOutputDto,
  WaterBillDetailDto,
  WaterBillSummaryDto,
  GenerateMonthlyBillsRequestDto,
  GenerateMonthlyBillsResponseDto,
  PageResponse,
  WaterBillStatsDto,
  DetailedDebtorsReportDto
} from '../models/water-system.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WaterBillService {
  private apiUrl = `${environment.apiUrl}/water-bills`;
  private reportUrl = `${environment.apiUrl}/water-reports`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Generar facturas mensuales para todos los socios con lectura
   * POST /water-bills/generate-monthly
   */
  generateMonthlyBills(request: GenerateMonthlyBillsRequestDto): Observable<GenerateMonthlyBillsResponseDto> {
    const headers = this.getHeaders();
    return this.http.post<GenerateMonthlyBillsResponseDto>(
      `${this.apiUrl}/generate-monthly`,
      request,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al generar facturas mensuales:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener todas las facturas
   * GET /water-bills
   */
  getAllBills(): Observable<WaterBillOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<WaterBillOutputDto[]>(this.apiUrl, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener facturas:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener facturas paginadas
   * GET /water-bills?page=0&size=20&search=...&statusCode=...
   */
  getBillsPaginated(page: number = 0, size: number = 20, search?: string, statusCode?: string): Observable<PageResponse<WaterBillOutputDto>> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (statusCode && statusCode.trim()) {
      params = params.set('statusCode', statusCode.trim());
    }

    return this.http.get<PageResponse<WaterBillOutputDto>>(this.apiUrl, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al cargar facturas paginadas:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener detalle de una factura
   * GET /water-bills/{id}
   */
  getBillById(id: string): Observable<WaterBillOutputDto> {
    const headers = this.getHeaders();
    return this.http.get<WaterBillOutputDto>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener factura:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener detalle completo de una factura con pagos
   * GET /water-bills/{id}/detail
   */
  getBillDetailWithPayments(id: string): Observable<WaterBillDetailDto> {
    const headers = this.getHeaders();
    return this.http.get<WaterBillDetailDto>(`${this.apiUrl}/${id}/detail`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener detalle de factura:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener facturas por socio
   * GET /water-bills/partner/{partnerId}
   */
  getBillsByPartner(partnerId: string): Observable<WaterBillOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<WaterBillOutputDto[]>(
      `${this.apiUrl}/partner/${partnerId}`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener facturas del socio:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener facturas pendientes de pago
   * GET /water-bills/pending
   */
  getPendingBills(): Observable<WaterBillOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<WaterBillOutputDto[]>(`${this.apiUrl}/pending`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener facturas pendientes:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener facturas vencidas
   * GET /water-bills/overdue
   */
  getOverdueBills(): Observable<WaterBillOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<WaterBillOutputDto[]>(`${this.apiUrl}/overdue`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener facturas vencidas:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener resumen de facturas para dashboard
   */
  getBillsSummary(): Observable<{ total: number; pending: number; overdue: number; paid: number }> {
    const headers = this.getHeaders();
    return this.http.get<{ total: number; pending: number; overdue: number; paid: number }>(
      `${this.apiUrl}/summary`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener resumen de facturas:', error);
        throw error;
      })
    );
  }

  getBillStats(search?: string, statusCode?: string): Observable<WaterBillStatsDto> {
    const headers = this.getHeaders();
    let params = new HttpParams();

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (statusCode && statusCode.trim()) {
      params = params.set('statusCode', statusCode.trim());
    }

    return this.http.get<WaterBillStatsDto>(`${this.apiUrl}/summary`, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener estadísticas de facturas:', error);
        throw error;
      })
    );
  }

  /**
   * Anular una factura
   * POST /water-bills/{id}/cancel?userId={userId}
   */
  cancelBill(id: string, userId: string): Observable<WaterBillOutputDto> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('userId', userId);
    return this.http.post<WaterBillOutputDto>(`${this.apiUrl}/${id}/cancel`, {}, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al anular factura:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener reporte detallado de deudores (completo)
   * GET /water-reports/debtors
   */
  getDebtorsReport(): Observable<DetailedDebtorsReportDto> {
    const headers = this.getHeaders();
    return this.http.get<DetailedDebtorsReportDto>(`${this.reportUrl}/debtors`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener reporte de deudores:', error);
        throw error;
      })
    );
  }
}






