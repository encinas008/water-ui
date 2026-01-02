import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommonOutputDto } from '../models/common.models';

@Injectable({
    providedIn: 'root'
})
export class CommonService {
    private apiUrl = `${environment.apiUrl}/commons`;
    private cache$: Observable<CommonOutputDto> | null = null;

    constructor(private http: HttpClient) { }

    getCommonData(): Observable<CommonOutputDto> {
        if (!this.cache$) {
            this.cache$ = this.http.get<CommonOutputDto>(this.apiUrl).pipe(
                shareReplay(1)
            );
        }
        return this.cache$;
    }
}
