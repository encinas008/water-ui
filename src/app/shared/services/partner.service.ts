import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { 
  PartnerOutputDto, 
  PartnerInputDto, 
  PartnerDebtSummaryDto 
} from '../models/water-system.models';
import { environment } from '../../../environments/environment';

// Interfaces adicionales para compatibilidad con componentes existentes
export interface PartnerProfile {
  dni: string;
  name: string;
  lastname: string;
  email: string;
  cellphone: string;
  telephone: string;
  cellphoneReferences: string;
  address: string;
  birthDate: string;
  countryId: string;
  cityId: string;
  genderTypeId: string;
  civilStatusTypeId: string;
}

export interface PartnerRequest {
  username: string;
  password: string;
  role: string;
  profile: PartnerProfile;
}

export interface PartnerResponse {
  success: boolean;
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private apiUrl = `${environment.apiUrl}/partners`;
  private usersApiUrl = `${environment.apiUrl}/users`;
  private commonsApiUrl = `${environment.apiUrl}/commons`;

  constructor(private http: HttpClient) { }

  // Método para obtener headers con autenticación
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

  // ============================================
  // CRUD BÁSICO DE PARTNERS
  // ============================================

  /**
   * Obtener todos los partners (socios)
   * GET /partners
   */
  getPartners(): Observable<PartnerOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(this.apiUrl, { headers }).pipe(
      tap(partners => {
        // Mapear 'cel' del backend a 'phoneNumber' del frontend
        partners.forEach(partner => {
          if (partner.cel !== undefined && !partner.phoneNumber) {
            partner.phoneNumber = partner.cel;
          }
        });
      }),
      catchError(error => {
        console.error('❌ Error al cargar partners:', error);
        throw error;
      })
    ) as Observable<PartnerOutputDto[]>;
  }

  /**
   * Obtener un partner por ID
   * GET /partners/{id}
   */
  getPartnerById(id: string): Observable<PartnerOutputDto> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(partner => {
        // Mapear 'cel' del backend a 'phoneNumber' del frontend
        if (partner.cel !== undefined && !partner.phoneNumber) {
          partner.phoneNumber = partner.cel;
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener partner:', error);
        throw error;
      })
    ) as Observable<PartnerOutputDto>;
  }

  /**
   * Crear nuevo partner
   * POST /partners
   */
  createPartner(partner: PartnerInputDto): Observable<PartnerOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<PartnerOutputDto>(this.apiUrl, partner, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear partner:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar partner existente
   * PUT /partners/{id}
   */
  updatePartner(id: string, partner: PartnerInputDto): Observable<PartnerOutputDto> {
    const headers = this.getHeaders();
    return this.http.put<PartnerOutputDto>(`${this.apiUrl}/${id}`, partner, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al actualizar partner:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar partner (baja lógica)
   * DELETE /partners/{id}
   */
  deletePartner(id: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al eliminar partner:', error);
        throw error;
      })
    );
  }

  // ============================================
  // FUNCIONALIDADES ESPECÍFICAS DE AGUA
  // ============================================

  /**
   * Obtener resumen de deuda de un partner
   * GET /partners/{id}/debt-summary
   */
  getPartnerDebtSummary(id: string): Observable<PartnerDebtSummaryDto> {
    const headers = this.getHeaders();
    return this.http.get<PartnerDebtSummaryDto>(`${this.apiUrl}/${id}/debt-summary`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener resumen de deuda:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar estado de conexión de agua
   * PATCH /partners/{id}/connection-status
   */
  updateConnectionStatus(id: string, statusCode: string): Observable<PartnerOutputDto> {
    const headers = this.getHeaders();
    return this.http.patch<PartnerOutputDto>(
      `${this.apiUrl}/${id}/connection-status`, 
      { connectionStatusCode: statusCode }, 
      { headers }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al actualizar estado de conexión:', error);
        throw error;
      })
    );
  }

  /**
   * Buscar partners por nombre, documento o número de conexión
   * GET /partners/search?q={query}
   */
  searchPartners(query: string): Observable<PartnerOutputDto[]> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('q', query);
    return this.http.get<PartnerOutputDto[]>(`${this.apiUrl}/search`, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al buscar partners:', error);
        throw error;
      })
    );
  }

  /**
   * Verificar si un número de medidor ya existe
   * GET /partners/check-meter-number?meterNumber={number}&excludePartnerId={id}
   */
  checkWaterMeterNumberExists(meterNumber: string, excludePartnerId?: string): Observable<{ exists: boolean }> {
    const headers = this.getHeaders();
    let params = new HttpParams().set('meterNumber', meterNumber);
    if (excludePartnerId) {
      params = params.set('excludePartnerId', excludePartnerId);
    }
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-meter-number`, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al verificar número de medidor:', error);
        throw error;
      })
    );
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  /**
   * Obtener partners con conexión de agua activa
   */
  getActiveWaterConnections(): Observable<PartnerOutputDto[]> {
    return this.getPartners().pipe(
      tap(partners => partners.filter(p => p.waterConnectionNumber && p.connectionStatusCode === 'ACTIVE'))
    );
  }

  /**
   * Obtener partners con deuda
   */
  getPartnersWithDebt(): Observable<PartnerOutputDto[]> {
    return this.getPartners().pipe(
      tap(partners => partners.filter(p => (p.currentDebt || 0) > 0))
    );
  }

  // ============================================
  // MÉTODOS DE COMPATIBILIDAD (Sistema Antiguo)
  // ============================================

  /**
   * Crear partner usando el sistema de usuarios (compatibilidad)
   * POST /users
   */
  createPartnerAsUser(partner: PartnerRequest, includeAuth: boolean = true): Observable<PartnerResponse> {
    const headers = this.getHeaders();
    return this.http.post<PartnerResponse>(this.usersApiUrl, partner, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear partner como usuario:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener datos comunes (países, ciudades, géneros, estados civiles)
   * GET /commons
   */
  getCommons(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.commonsApiUrl, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al cargar datos comunes:', error);
        throw error;
      })
    );
  }
}

