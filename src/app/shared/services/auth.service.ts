import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignInResponse {
  token: string;
  refreshToken: string;
  user?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    
  private apiUrl = 'http://localhost:8085/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_info';

  constructor(private http: HttpClient) {}

  signIn(username: string, password: string): Observable<SignInResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body: SignInRequest = {
      username,
      password
    };

    return this.http.post<SignInResponse>(`${this.apiUrl}/sign-in`, body, { headers }).pipe(
      tap(response => {
        // Guardar token y refreshToken
        if (response.token) {
          this.setToken(response.token);
        }
        
        if (response.refreshToken) {
          this.setRefreshToken(response.refreshToken);
        }

        // Decodificar y guardar info del usuario desde el JWT
        if (response.token) {
          const userInfo = this.decodeToken(response.token);
          if (userInfo) {
            this.setUserInfo(userInfo);
          }
        }
      })
    );
  }

  // Guardar token
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Guardar refresh token
  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // Obtener refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Guardar información del usuario
  setUserInfo(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Obtener información del usuario
  getUserInfo(): any {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Verificar si el token ha expirado
    try {
      const payload = this.decodeToken(token);
      if (payload && payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        return expirationDate > new Date();
      }
    } catch (error) {
      console.error('Error al verificar token:', error);
      return false;
    }

    return true;
  }

  // Decodificar JWT (sin verificar firma, solo para leer payload)
  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Obtener headers con autenticación
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}

