import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  JobPartnerOutputDto,
  AssignPartnersToJobDto,
  JobPartnerAssignmentDto
} from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class JobPartnerService {
  private apiUrl = `${environment.apiUrl}/jobs`;

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

  getPartnersByJob(jobId: string): Observable<JobPartnerOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<JobPartnerOutputDto[]>(`${this.apiUrl}/${jobId}/partners`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar socios del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  getJobWithPartnerAssignments(jobId: string): Observable<JobPartnerAssignmentDto> {
    const headers = this.getHeaders();
    return this.http.get<JobPartnerAssignmentDto>(`${this.apiUrl}/${jobId}/partners/assignments`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asignaciones del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  assignPartnersToJob(jobId: string, partnerIds: string[]): Observable<JobPartnerOutputDto[]> {
    const headers = this.getHeaders();
    const body: AssignPartnersToJobDto = { partnerIds };
    return this.http.post<JobPartnerOutputDto[]>(`${this.apiUrl}/${jobId}/partners`, body, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al asignar socios al trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  removePartnerFromJob(jobId: string, partnerId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${jobId}/partners/${partnerId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al remover socio ${partnerId} del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }
}

