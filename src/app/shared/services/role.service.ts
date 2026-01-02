import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleOutputDto } from '../models/water-system.models';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private apiUrl = `${environment.apiUrl}/roles`;

    constructor(private http: HttpClient) { }

    getAllRoles(): Observable<RoleOutputDto[]> {
        return this.http.get<RoleOutputDto[]>(`${this.apiUrl}`);
    }
}
