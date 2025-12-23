import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttendanceOutputDto,
  AttendanceInputDto,
  AttendanceUpdateDto,
  AttendanceByDateDto,
  BulkAttendanceInputDto
} from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

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

  getAttendanceByJob(jobId: string): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<AttendanceOutputDto[]>(`${this.apiUrl}/job/${jobId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  getAttendanceByJobAndDate(jobId: string, date: string): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<AttendanceOutputDto[]>(`${this.apiUrl}/job/${jobId}/date/${date}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia del trabajo ${jobId} para la fecha ${date}:`, error);
        throw error;
      })
    );
  }

  getAttendanceByJobAndDateRange(jobId: string, startDate: string, endDate: string): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<AttendanceOutputDto[]>(`${this.apiUrl}/job/${jobId}/date-range`, { headers, params }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia del trabajo ${jobId} en el rango ${startDate} - ${endDate}:`, error);
        throw error;
      })
    );
  }

  getAttendanceGroupedByDate(jobId: string, startDate: string, endDate: string): Observable<AttendanceByDateDto[]> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<AttendanceByDateDto[]>(`${this.apiUrl}/job/${jobId}/grouped`, { headers, params }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia agrupada del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  getAttendanceByPartner(partnerId: string): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<AttendanceOutputDto[]>(`${this.apiUrl}/partner/${partnerId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia del socio ${partnerId}:`, error);
        throw error;
      })
    );
  }

  createAttendance(attendance: AttendanceInputDto): Observable<AttendanceOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<AttendanceOutputDto>(this.apiUrl, attendance, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear registro de asistencia:', error);
        throw error;
      })
    );
  }

  bulkCreateAttendance(bulkAttendance: BulkAttendanceInputDto): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.post<AttendanceOutputDto[]>(`${this.apiUrl}/bulk`, bulkAttendance, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear registros de asistencia en bloque:', error);
        throw error;
      })
    );
  }

  updateAttendance(id: string, attendance: AttendanceUpdateDto): Observable<AttendanceOutputDto> {
    const headers = this.getHeaders();
    return this.http.put<AttendanceOutputDto>(`${this.apiUrl}/${id}`, attendance, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al actualizar asistencia ${id}:`, error);
        throw error;
      })
    );
  }

  deleteAttendance(id: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al eliminar asistencia ${id}:`, error);
        throw error;
      })
    );
  }
}

