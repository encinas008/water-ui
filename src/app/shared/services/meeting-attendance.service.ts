import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BulkMeetingAttendanceInputDto, MeetingAttendanceOutputDto, MeetingAttendanceUpdateDto, MeetingPartnerAssignmentDto, AssignPartnersToMeetingDto } from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class MeetingAttendanceService {
  private apiUrl = `${environment.apiUrl}/meetings`;

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

  getAttendanceByMeeting(meetingId: string): Observable<MeetingAttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<MeetingAttendanceOutputDto[]>(`${this.apiUrl}/${meetingId}/attendance`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia para la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }

  getAttendanceByMeetingAndDate(meetingId: string, date: string): Observable<MeetingAttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<MeetingAttendanceOutputDto[]>(`${this.apiUrl}/${meetingId}/attendance/date/${date}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asistencia para la reunión ${meetingId} en fecha ${date}:`, error);
        throw error;
      })
    );
  }

  bulkCreateAttendance(bulkAttendance: BulkMeetingAttendanceInputDto): Observable<MeetingAttendanceOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.post<MeetingAttendanceOutputDto[]>(`${this.apiUrl}/${bulkAttendance.meetingId}/attendance/bulk`, bulkAttendance, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al guardar asistencia para la reunión ${bulkAttendance.meetingId}:`, error);
        throw error;
      })
    );
  }

  updateAttendance(meetingId: string, attendanceId: string, update: MeetingAttendanceUpdateDto): Observable<MeetingAttendanceOutputDto> {
    const headers = this.getHeaders();
    return this.http.put<MeetingAttendanceOutputDto>(`${this.apiUrl}/${meetingId}/attendance/${attendanceId}`, update, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al actualizar asistencia ${attendanceId}:`, error);
        throw error;
      })
    );
  }

  deleteAttendance(meetingId: string, attendanceId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${meetingId}/attendance/${attendanceId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al eliminar asistencia ${attendanceId}:`, error);
        throw error;
      })
    );
  }

  // Métodos para reemplazar funcionalidad de MeetingPartnerService
  getMeetingWithPartnerAssignments(meetingId: string): Observable<MeetingPartnerAssignmentDto> {
    const headers = this.getHeaders();
    return this.http.get<MeetingPartnerAssignmentDto>(`${this.apiUrl}/${meetingId}/attendance/assignments`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asignaciones de socios para la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }

  assignPartnersToMeeting(meetingId: string, partnerIds: string[]): Observable<MeetingAttendanceOutputDto[]> {
    const headers = this.getHeaders();
    const body: AssignPartnersToMeetingDto = { partnerIds };
    return this.http.post<MeetingAttendanceOutputDto[]>(`${this.apiUrl}/${meetingId}/attendance/assign-partners`, body, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al asignar socios a la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }

  removePartnerFromMeeting(meetingId: string, partnerId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${meetingId}/attendance/partner/${partnerId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al remover socio ${partnerId} de la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }
}

