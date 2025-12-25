import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttendanceOutputDto,
  AttendanceInputDto,
  AttendanceUpdateDto,
  AttendanceByDateDto,
  BulkAttendanceInputDto,
  JobPartnerAssignmentDto,
  AssignPartnersToJobDto
} from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/jobs`;
  private attendanceGeneralUrl = `${environment.apiUrl}/attendance`;

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
    return this.http.get<AttendanceOutputDto[]>(`${this.apiUrl}/${jobId}/attendance`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  getAttendanceByJobAndDate(jobId: string, date: string): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<AttendanceOutputDto[]>(`${this.apiUrl}/${jobId}/attendance/date/${date}`, { headers }).pipe(
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
    return this.http.get<AttendanceOutputDto[]>(`${this.apiUrl}/${jobId}/attendance/date-range`, { headers, params }).pipe(
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
    return this.http.get<AttendanceByDateDto[]>(`${this.apiUrl}/${jobId}/attendance/grouped`, { headers, params }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia agrupada del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  getAttendanceByPartner(partnerId: string): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<AttendanceOutputDto[]>(`${this.attendanceGeneralUrl}/partner/${partnerId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia del socio ${partnerId}:`, error);
        throw error;
      })
    );
  }

  bulkCreateAttendance(bulkAttendance: BulkAttendanceInputDto): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.post<AttendanceOutputDto[]>(`${this.apiUrl}/${bulkAttendance.jobId}/attendance/bulk`, bulkAttendance, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear registros de asistencia en bloque:', error);
        throw error;
      })
    );
  }

  updateAttendance(jobId: string, attendanceId: string, attendance: AttendanceUpdateDto): Observable<AttendanceOutputDto> {
    const headers = this.getHeaders();
    return this.http.put<AttendanceOutputDto>(`${this.apiUrl}/${jobId}/attendance/${attendanceId}`, attendance, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al actualizar asistencia ${attendanceId}:`, error);
        throw error;
      })
    );
  }

  deleteAttendance(jobId: string, attendanceId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${jobId}/attendance/${attendanceId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al eliminar asistencia ${attendanceId}:`, error);
        throw error;
      })
    );
  }

  // Métodos para reemplazar funcionalidad de JobPartnerService
  getJobWithPartnerAssignments(jobId: string): Observable<JobPartnerAssignmentDto> {
    const headers = this.getHeaders();
    return this.http.get<JobPartnerAssignmentDto>(`${this.apiUrl}/${jobId}/attendance/assignments`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asignaciones del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  assignPartnersToJob(jobId: string, partnerIds: string[]): Observable<AttendanceOutputDto[]> {
    const headers = this.getHeaders();
    const body: AssignPartnersToJobDto = { partnerIds };
    return this.http.post<AttendanceOutputDto[]>(`${this.apiUrl}/${jobId}/attendance/assign-partners`, body, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al asignar socios al trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }

  removePartnerFromJob(jobId: string, partnerId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${jobId}/attendance/partner/${partnerId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al remover socio ${partnerId} del trabajo ${jobId}:`, error);
        throw error;
      })
    );
  }
}

