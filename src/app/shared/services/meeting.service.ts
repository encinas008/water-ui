import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeetingInputDto, MeetingOutputDto, MeetingUpdateDto, PageResponse } from '../models/water-system.models';

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

  /**
   * Obtener reuniones paginadas
   * GET /meetings?page=0&size=20&search=...
   */
  getMeetingsPaginated(page: number = 0, size: number = 20, search?: string): Observable<PageResponse<MeetingOutputDto>> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    
    return this.http.get<PageResponse<MeetingOutputDto>>(this.apiUrl, { headers, params }).pipe(
      catchError(error => {
        console.error('❌ Error al cargar reuniones paginadas:', error);
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



