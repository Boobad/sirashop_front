import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SuperAdminStats {
  totalCompanies: number;
  activeCompanies: number;
  blockedCompanies: number;
  totalShops: number;
  totalUsers: number;
  monthlyTariff: number;
  expectedMonthlyRevenue: number;
  totalSubscriptionRevenue: number;
  currentMonthSubscriptionRevenue: number;
}

export interface AdminUser {
  id?: number;
  username: string;
  role: string;
  active: boolean;
}

export interface SubscriptionPayment {
  id?: number;
  companyId: number;
  companyName?: string;
  amount: number;
  periodMonth: string;
  periodYear?: number;
  notes?: string;
  paymentDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private apiUrl = 'http://localhost:8085/api/super-admin';

  constructor(private http: HttpClient) { }

  getStats(): Observable<SuperAdminStats> {
    return this.http.get<SuperAdminStats>(`${this.apiUrl}/stats`);
  }

  createSuperAdmin(admin: { username: string; password: string }): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.apiUrl}/admins`, admin);
  }

  getSuperAdmins(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/admins`);
  }

  recordPayment(payment: Partial<SubscriptionPayment>): Observable<SubscriptionPayment> {
    return this.http.post<SubscriptionPayment>(`${this.apiUrl}/subscriptions/pay`, payment);
  }

  getAllPayments(): Observable<SubscriptionPayment[]> {
    return this.http.get<SubscriptionPayment[]>(`${this.apiUrl}/subscriptions`);
  }
}
