import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from './company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = 'http://localhost:8085/api/companies';

  constructor(private http: HttpClient) { }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl);
  }

  createCompany(company: Company): Observable<Company> {
    return this.http.post<Company>(this.apiUrl, company);
  }

  createCompanyWithOwner(data: {
    companyName: string;
    ownerUsername: string;
    ownerPassword: string;
    ownerName?: string;
    phone?: string;
    hasSalesEnabled?: boolean;
    hasRepairsEnabled?: boolean;
  }): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/with-owner`, data);
  }

  updateCompany(companyId: number, company: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/${companyId}`, company);
  }

  toggleCompanyActive(companyId: number): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/${companyId}/toggle-active`, {});
  }
}
