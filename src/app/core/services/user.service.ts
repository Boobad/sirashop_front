import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8085/api/users';

  constructor(private http: HttpClient) { }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(userId: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, user);
  }

  toggleUserStatus(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}/toggle-active`, {});
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`);
  }

  changePassword(userId: number, oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, { userId, oldPassword, newPassword });
  }

  getUsersByCompany(companyId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/company/${companyId}`);
  }

  getUsersByShop(shopId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/shop/${shopId}`);
  }
}
