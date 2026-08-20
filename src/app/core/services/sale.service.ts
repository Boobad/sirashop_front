import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale } from './sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private apiUrl = 'http://localhost:8085/api/sales';

  constructor(private http: HttpClient) { }

  processSale(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, sale);
  }

  getSalesByShop(shopId: number): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/shop/${shopId}`);
  }

  getSalesByCompany(companyId: number): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/company/${companyId}`);
  }
}
