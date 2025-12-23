import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssignPartnersToMeetingDto, MeetingPartnerAssignmentDto, MeetingPartnerOutputDto } from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class MeetingPartnerService {
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

  getPartnersByMeetingId(meetingId: string): Observable<MeetingPartnerOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<MeetingPartnerOutputDto[]>(`${this.apiUrl}/${meetingId}/partners`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar socios para la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }

  getMeetingWithPartnerAssignments(meetingId: string): Observable<MeetingPartnerAssignmentDto> {
    const headers = this.getHeaders();
    return this.http.get<MeetingPartnerAssignmentDto>(`${this.apiUrl}/${meetingId}/partners/assignments`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al cargar asignaciones de socios para la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }

  assignPartnersToMeeting(meetingId: string, partnerIds: string[]): Observable<MeetingPartnerOutputDto[]> {
    const headers = this.getHeaders();
    const body: AssignPartnersToMeetingDto = { partnerIds };
    return this.http.post<MeetingPartnerOutputDto[]>(`${this.apiUrl}/${meetingId}/partners`, body, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al asignar socios a la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }

  removePartnerFromMeeting(meetingId: string, partnerId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${meetingId}/partners/${partnerId}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al remover socio ${partnerId} de la reunión ${meetingId}:`, error);
        throw error;
      })
    );
  }
}

