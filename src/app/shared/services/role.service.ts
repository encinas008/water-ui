import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleOutputDto, RoleInputDto } from '../models/water-system.models';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private apiUrl = `${environment.apiUrl}/roles`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<RoleOutputDto[]> {
        return this.http.get<RoleOutputDto[]>(this.apiUrl);
    }

    getById(id: string): Observable<RoleOutputDto> {
        return this.http.get<RoleOutputDto>(`${this.apiUrl}/${id}`);
    }

    create(role: RoleInputDto): Observable<RoleOutputDto> {
        return this.http.post<RoleOutputDto>(this.apiUrl, role);
    }

    update(id: string, role: RoleInputDto): Observable<RoleOutputDto> {
        return this.http.put<RoleOutputDto>(`${this.apiUrl}/${id}`, role);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
