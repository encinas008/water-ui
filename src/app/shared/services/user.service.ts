import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDetails, UserOutputDto, UserInputDto, UpdateUserInputDto } from '../models/water-system.models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}`; // Base API URL

    constructor(private http: HttpClient) { }

    getAllUsers(): Observable<UserDetails[]> {
        return this.http.get<UserDetails[]>(`${this.apiUrl}/users`);
    }

    getUserById(id: string): Observable<UserDetails> {
        return this.http.get<UserDetails>(`${this.apiUrl}/users/${id}`);
    }

    createUser(userData: UserInputDto): Observable<UserOutputDto> {
        return this.http.post<UserOutputDto>(`${this.apiUrl}/users`, userData);
    }

    updateUser(id: string, userData: UpdateUserInputDto): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/users/${id}`, userData);
    }

    // Update status (soft delete or activate)
    updateStatus(id: string, active: boolean): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/users/${id}`, { active });
    }
}
