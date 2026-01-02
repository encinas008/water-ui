import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import {
  CashBalanceInputDto,
  CashBalanceOutputDto,
  CashBalanceDetailsOutputDto,
  CloseCashBalanceInputDto,
  PageResponse
} from '../models/water-system.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CashBalanceService {
  private apiUrl = `${environment.apiUrl}/cash-balances`;

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
   * Obtener todos los balances de caja por usuario
   * GET /cash-balances/users/{userId}?fromDate={timestamp}&toDate={timestamp}
   */
  getCashBalancesByUser(
    userId: string,
    fromDate?: number,
    toDate?: number
  ): Observable<CashBalanceOutputDto[]> {
    const headers = this.getHeaders();
    let params = new HttpParams();

    if (fromDate) {
      params = params.set('fromDate', fromDate.toString());
    }
    if (toDate) {
      params = params.set('toDate', toDate.toString());
    }

    return this.http.get<CashBalanceOutputDto[]>(
      `${this.apiUrl}/users/${userId}`,
      { headers, params }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener balances de caja:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener el último balance de caja abierto por usuario
   * GET /cash-balances/users/{userId}/last-open
   */
  getLastOpenCashBalanceByUser(userId: string): Observable<CashBalanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<CashBalanceOutputDto[]>(
      `${this.apiUrl}/users/${userId}/last-open`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener último balance abierto:', error);
        throw error;
      })
    );
  }

  /**
   * Crear un nuevo balance de caja
   * POST /cash-balances
   */
  createCashBalance(cashBalance: CashBalanceInputDto): Observable<CashBalanceOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<CashBalanceOutputDto>(this.apiUrl, cashBalance, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear balance de caja:', error);
        throw error;
      })
    );
  }

  /**
   * Cerrar un balance de caja
   * POST /cash-balances/close
   */
  closeCashBalance(closeInput: CloseCashBalanceInputDto): Observable<boolean> {
    const headers = this.getHeaders();
    return this.http.post<boolean>(`${this.apiUrl}/close`, closeInput, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al cerrar balance de caja:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener detalles de un balance de caja
   * GET /cash-balances/{id}
   */
  getCashBalanceDetails(id: string): Observable<CashBalanceDetailsOutputDto> {
    const headers = this.getHeaders();
    return this.http.get<CashBalanceDetailsOutputDto>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener detalles del balance:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener todos los balances de caja activos
   * GET /cash-balances
   */
  getAllCashBalances(): Observable<CashBalanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<CashBalanceOutputDto[]>(this.apiUrl, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener todos los balances de caja:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener balances de caja paginados
   * GET /cash-balances?page=0&size=20&search=...
   */
  getCashBalancesPaginated(page: number = 0, size: number = 20, search?: string): Observable<PageResponse<CashBalanceOutputDto>> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponse<CashBalanceOutputDto>>(this.apiUrl, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al cargar balances de caja paginados:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener tipos de pago
   */
  getPaymentTypes(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${environment.apiUrl}/commons`, { headers }).pipe(
      map((res: any) => res.paymentTypes || []),
      catchError(error => {
        console.error('❌ Error al obtener tipos de pago:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener balance abierto para un usuario
   */
  getOpenCashBalanceForUser(userId: string): Observable<CashBalanceOutputDto | null> {
    return this.getLastOpenCashBalanceByUser(userId).pipe(
      map((balances: CashBalanceOutputDto[]) => balances.length > 0 ? balances[0] : null)
    );
  }
}

