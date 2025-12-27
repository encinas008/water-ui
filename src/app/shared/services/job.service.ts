import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { 
  JobOutputDto, 
  JobInputDto, 
  JobUpdateDto 
} from '../models/water-system.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/jobs`;

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

  /**
   * Obtener todos los trabajos
   * GET /jobs
   */
  getJobs(): Observable<JobOutputDto[]> {
    const headers = this.getHeaders();
    return this.http.get<JobOutputDto[]>(this.apiUrl, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al cargar trabajos:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener un trabajo por ID
   * GET /jobs/{id}
   */
  getJobById(id: string): Observable<JobOutputDto> {
    const headers = this.getHeaders();
    return this.http.get<JobOutputDto>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al obtener trabajo:', error);
        throw error;
      })
    );
  }

  /**
   * Crear nuevo trabajo
   * POST /jobs
   */
  createJob(input: JobInputDto): Observable<JobOutputDto> {
    const headers = this.getHeaders();
    return this.http.post<JobOutputDto>(this.apiUrl, input, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al crear trabajo:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar trabajo existente
   * PUT /jobs/{id}
   */
  updateJob(id: string, input: JobUpdateDto): Observable<JobOutputDto> {
    const headers = this.getHeaders();
    return this.http.put<JobOutputDto>(`${this.apiUrl}/${id}`, input, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al actualizar trabajo:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar trabajo (soft delete)
   * DELETE /jobs/{id}
   */
  deleteJob(id: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error al eliminar trabajo:', error);
        throw error;
      })
    );
  }
}




