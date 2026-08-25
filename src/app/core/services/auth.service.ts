import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'MANAGER' | 'SELLER' | 'TECHNICIAN' | 'REPAIRER';

export interface LoginResponse {
  token: string;
  id: number;
  username: string;
  role: UserRole;
  companyId?: number;
  shopId?: number;
  shopName?: string;
  companyName?: string;
  hasSalesEnabled?: boolean;
  hasRepairsEnabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8085/api/auth';
  private USER_KEY = 'sirashop_user';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(response));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  getUser(): LoginResponse | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }

  hasSales(): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.hasSalesEnabled !== false;
  }

  hasRepairs(): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.hasRepairsEnabled !== false;
  }
}
