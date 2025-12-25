import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { 
  CashFlowInputDto,
  CashFlowOutputDto
} from '../models/water-system.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CashFlowService {
  private apiUrl = `${environment.apiUrl}/cash-flows`;

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
   * Crear un flujo de caja (retiro o ingreso)
   * POST /cash-flows
   */
  createCashFlow(cashFlow: CashFlowInputDto): Observable<CashFlowOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<CashFlowOutputDto>(this.apiUrl, cashFlow, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear flujo de caja:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener retiros por balance de caja
   * GET /cash-flows/cash-balance/{cashBalanceId}/withdrawals
   */
  getWithdrawalsByCashBalance(cashBalanceId: string): Observable<CashFlowOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<CashFlowOutputDto[]>(`${this.apiUrl}/cash-balance/${cashBalanceId}/withdrawals`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener retiros:', error);
        throw error;
      })
    );
  }
}

