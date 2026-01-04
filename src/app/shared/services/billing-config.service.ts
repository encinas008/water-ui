import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { BillingConfigOutputDto, BillingConfigUpdateDto } from '../models/water-system.models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BillingConfigService {
    private apiUrl = `${environment.apiUrl}/billing-config`;

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
     * Obtener todas las configuraciones de facturación
     * GET /billing-config
     */
    getAllConfigs(): Observable<BillingConfigOutputDto[]> {
        const headers = this.getHeaders();
        return this.http.get<BillingConfigOutputDto[]>(this.apiUrl, { headers }).pipe(
            catchError(error => {
                console.error('❌ Error al obtener configuraciones:', error);
                throw error;
            })
        );
    }

    /**
     * Actualizar una configuración específica
     * PUT /billing-config/{key}
     */
    updateConfig(key: string, value: number): Observable<BillingConfigOutputDto> {
        const headers = this.getHeaders();
        const input: BillingConfigUpdateDto = { configValue: value };
        return this.http.put<BillingConfigOutputDto>(`${this.apiUrl}/${key}`, input, { headers }).pipe(
            catchError(error => {
                console.error('❌ Error al actualizar configuración:', error);
                throw error;
            })
        );
    }
}
