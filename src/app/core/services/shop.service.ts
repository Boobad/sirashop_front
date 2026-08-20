import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shop } from './shop.model';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private apiUrl = 'http://localhost:8085/api/shops';

  constructor(private http: HttpClient) { }

  getShopsByCompany(companyId: number): Observable<Shop[]> {
    return this.http.get<Shop[]>(`${this.apiUrl}/company/${companyId}`);
  }

  createShop(shop: Partial<Shop>): Observable<Shop> {
    return this.http.post<Shop>(this.apiUrl, shop);
  }
}
