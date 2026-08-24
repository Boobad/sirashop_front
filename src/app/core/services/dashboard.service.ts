import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stats } from './stats.model';
import { AdvancedStats } from './advanced-stats.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8085/api/dashboard';

  constructor(private http: HttpClient) { }

  getCompanyStats(companyId: number): Observable<Stats> {
    return this.http.get<Stats>(`${this.apiUrl}/company/${companyId}`);
  }

  getAdvancedStats(companyId: number): Observable<AdvancedStats> {
    return this.http.get<AdvancedStats>(`${this.apiUrl}/company/${companyId}/advanced`);
  }
}

