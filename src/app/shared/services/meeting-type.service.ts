import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeetingTypeOutputDto } from '../models/water-system.models';

@Injectable({
  providedIn: 'root'
})
export class MeetingTypeService {
  private apiUrl = `${environment.apiUrl}/meeting-types`;

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

  getMeetingTypes(): Observable<MeetingTypeOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<MeetingTypeOutputDto[]>(this.apiUrl, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al cargar tipos de reunión:', error);
        throw error;
      })
    );
  }
}

