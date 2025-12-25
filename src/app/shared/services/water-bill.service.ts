import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { 
  WaterBillOutputDto,
  WaterBillDetailDto,
  WaterBillSummaryDto,
  GenerateMonthlyBillsRequestDto,
  GenerateMonthlyBillsResponseDto
} from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class WaterBillService {
  private apiUrl = 'http://localhost:8085/api/water-bills';

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
}






