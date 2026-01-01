import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import {
  WaterPaymentOutputDto,
  WaterPaymentInputDto,
  PaymentReceiptDto,
  PaymentReceiptFullDto,
  PaymentType,
  MonthlyPendingFinesDto
} from '../models/water-system.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WaterPaymentService {
  private apiUrl = `${environment.apiUrl}/water-payments`;

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
   * Registrar un nuevo pago
   * POST /water-payments
   */
  createPayment(payment: WaterPaymentInputDto): Observable<WaterPaymentOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<WaterPaymentOutputDto>(this.apiUrl, payment, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al registrar pago:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener historial de pagos por socio
   * GET /water-payments/partner/{partnerId}
   */
  getPaymentsByPartner(partnerId: string): Observable<WaterPaymentOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<WaterPaymentOutputDto[]>(
      `${this.apiUrl}/partner/${partnerId}`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener pagos del socio:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener detalle de un pago
   * GET /water-payments/{id}
   */
  getPaymentById(id: string): Observable<WaterPaymentOutputDto> {
    const headers = this.getHeaders();
    return this.http.get<WaterPaymentOutputDto>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener pago:', error);
        throw error;
      })
    );
  }

  /**
   * Generar recibo de pago
   * GET /water-payments/receipt/{id}
   */
  getPaymentReceipt(id: string): Observable<PaymentReceiptDto> {
    const headers = this.getHeaders();
    return this.http.get<PaymentReceiptDto>(`${this.apiUrl}/receipt/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener recibo:', error);
        throw error;
      })
    );
  }

  /**
   * Generar recibo completo de pago (con conceptos desglosados)
   * GET /water-payments/receipt-full/{id}?receiptType=NOTA DE PAGO
   */
  getFullPaymentReceipt(id: string, receiptType: string = 'NOTA DE PAGO'): Observable<PaymentReceiptFullDto> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('receiptType', receiptType);
    return this.http.get<PaymentReceiptFullDto>(
      `${this.apiUrl}/receipt-full/${id}`,
      { headers, params }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener recibo completo:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener todos los pagos
   * GET /water-payments
   */
  getAllPayments(): Observable<WaterPaymentOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<WaterPaymentOutputDto[]>(this.apiUrl, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener todos los pagos:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener tipos de pago disponibles
   * GET /commons
   */
  getPaymentTypes(): Observable<PaymentType[]> {
    const headers = this.getHeaders();
    const commonsUrl = `${environment.apiUrl}/commons`;

    return this.http.get<any>(commonsUrl, { headers }).pipe(
      map(response => {
        // Extraer paymentTypes del payload de respuesta
        const paymentTypes = response.paymentTypes || [];

        // Mapear PaymentTypeOutputDto a PaymentType
        return paymentTypes.map((pt: any) => ({
          id: pt.id,
          name: pt.name,
          description: pt.description || '',
          active: true // El backend no retorna active, asumimos que todos están activos
        } as PaymentType));
      }),
      catchError(error => {
        console.error('❌ Error al obtener tipos de pago:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener multas pendientes del mes actual por socio
   * GET /water-payments/pending-fines/partner/{partnerId}
   */
  getCurrentMonthPendingFines(partnerId: string): Observable<MonthlyPendingFinesDto> {
    const headers = this.getHeaders();
    return this.http.get<MonthlyPendingFinesDto>(`${this.apiUrl}/pending-fines/partner/${partnerId}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener multas pendientes:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener multas pendientes de un mes específico por socio
   * GET /water-payments/pending-fines/partner/{partnerId}/month/{month}/year/{year}
   */
  getMonthlyPendingFines(partnerId: string, month: number, year: number): Observable<MonthlyPendingFinesDto> {
    const headers = this.getHeaders();
    return this.http.get<MonthlyPendingFinesDto>(`${this.apiUrl}/pending-fines/partner/${partnerId}/month/${month}/year/${year}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener multas pendientes:', error);
        throw error;
      })
    );
  }

  /**
   * Descargar PDF de recibo de pago
   * GET /water-payments/{id}/receipt-pdf
   */
  downloadReceiptPdf(paymentId: string): Promise<void> {
    const headers = this.getHeaders().set("Accept", "application/pdf");
    const reportUrl = `${environment.apiUrl}/reports/${paymentId}/receipt-pdf`;

    return this.http
      .get(reportUrl, { headers: headers, responseType: "blob" })
      .toPromise()
      .then((result: Blob | undefined) => {
        if (!result) return;
        const file = new Blob([result], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, "_blank", "width=1000, height=800");
      })
      .catch((error) => {
        console.error('❌ Error al generar impresión PDF:', error);
        throw error;
      });
  }
}
