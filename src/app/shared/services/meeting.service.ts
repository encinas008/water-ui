import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeetingInputDto, MeetingOutputDto, MeetingUpdateDto } from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
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

  getMeetings(): Observable<MeetingOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<MeetingOutputDto[]>(this.apiUrl, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al cargar reuniones:', error);
        throw error;
      })
    );
  }

  getMeetingById(id: string): Observable<MeetingOutputDto> {
    const headers = this.getHeaders();
    return this.http.get<MeetingOutputDto>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al obtener reunión con ID ${id}:`, error);
        throw error;
      })
    );
  }

  createMeeting(meeting: MeetingInputDto): Observable<MeetingOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<MeetingOutputDto>(this.apiUrl, meeting, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear reunión:', error);
        throw error;
      })
    );
  }

  updateMeeting(id: string, meeting: MeetingUpdateDto): Observable<MeetingOutputDto> {
    const headers = this.getHeaders();
    return this.http.put<MeetingOutputDto>(`${this.apiUrl}/${id}`, meeting, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al actualizar reunión con ID ${id}:`, error);
        throw error;
      })
    );
  }

  deleteMeeting(id: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error(`❌ Error al eliminar reunión con ID ${id}:`, error);
        throw error;
      })
    );
  }
}



