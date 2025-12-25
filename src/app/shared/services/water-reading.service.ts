import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { 
  WaterMeterReadingOutputDto, 
  WaterMeterReadingInputDto 
} from '../models/water-system.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WaterReadingService {
  private apiUrl = `${environment.apiUrl}/water-readings`;

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
   * Registrar nueva lectura de medidor
   * POST /water-readings
   */
  createReading(reading: WaterMeterReadingInputDto): Observable<WaterMeterReadingOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<WaterMeterReadingOutputDto>(this.apiUrl, reading, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear lectura:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener historial de lecturas por socio
   * GET /water-readings/partner/{partnerId}
   */
  getReadingsByPartner(partnerId: string): Observable<WaterMeterReadingOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<WaterMeterReadingOutputDto[]>(
      `${this.apiUrl}/partner/${partnerId}`, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener lecturas:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener detalle de una lectura específica
   * GET /water-readings/{id}
   */
  getReadingById(id: string): Observable<WaterMeterReadingOutputDto> {
    const headers = this.getHeaders();
    return this.http.get<WaterMeterReadingOutputDto>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener lectura:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar lectura existente
   * PUT /water-readings/{id}
   */
  updateReading(id: string, reading: WaterMeterReadingInputDto): Observable<WaterMeterReadingOutputDto> {
    const headers = this.getHeaders();
    return this.http.put<WaterMeterReadingOutputDto>(`${this.apiUrl}/${id}`, reading, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al actualizar lectura:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener lecturas por período
   * GET /water-readings/period?startDate={startDate}&endDate={endDate}
   */
  getReadingsByPeriod(startDate: string, endDate: string): Observable<WaterMeterReadingOutputDto[]> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<WaterMeterReadingOutputDto[]>(
      `${this.apiUrl}/period`, 
      { headers, params }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener lecturas por período:', error);
        throw error;
      })
    );
  }

  /**
   * Verificar si existe una lectura para un socio en un mes específico
   * Obtiene todas las lecturas del socio y verifica si hay alguna en el mismo mes
   */
  checkReadingExistsForMonth(partnerId: string, readingDate: string): Observable<boolean> {
    return this.getReadingsByPartner(partnerId).pipe(
      map((readings) => {
        const date = new Date(readingDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() retorna 0-11
        
        return readings.some(reading => {
          const readingDateObj = new Date(reading.readingDate);
          return readingDateObj.getFullYear() === year && 
                 readingDateObj.getMonth() + 1 === month;
        });
      }),
      catchError(error => {
        console.error('❌ Error al verificar lecturas:', error);
        // En caso de error, retornar false para permitir que el backend valide
        return of(false);
      })
    );
  }
}

