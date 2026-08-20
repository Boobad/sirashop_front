import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8085/api/products';

  constructor(private http: HttpClient) { }

  getProductsByCompany(companyId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/company/${companyId}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }
}
