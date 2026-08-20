import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventory } from './inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = 'http://localhost:8085/api/inventory';

  constructor(private http: HttpClient) { }

  setStock(shopId: number, productId: number, quantity: number, alertThreshold?: number): Observable<Inventory> {
    let url = `${this.apiUrl}/set-stock?shopId=${shopId}&productId=${productId}&quantity=${quantity}`;
    if (alertThreshold) {
      url += `&alertThreshold=${alertThreshold}`;
    }
    return this.http.post<Inventory>(url, {});
  }

  getInventoryByShop(shopId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiUrl}/shop/${shopId}`);
  }

  getNetworkStockByProduct(productId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiUrl}/product/${productId}/network`);
  }
}
