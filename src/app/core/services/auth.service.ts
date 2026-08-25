import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'MANAGER' | 'SELLER' | 'TECHNICIAN' | 'REPAIRER';

export interface LoginResponse {
  token: string;
  id: number;
  email?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  mustChangePassword?: boolean;
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

  updateLocalUser(updates: Partial<LoginResponse>): void {
    const current = this.getUser();
    if (current) {
      const updated = { ...current, ...updates };
      localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    }
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  mustChangePassword(): boolean {
    const user = this.getUser();
    return !!user?.mustChangePassword;
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

  getUserDisplayName(user?: any): string {
    const target = user || this.getUser();
    if (!target) return 'Utilisateur';

    // 1. Si prénom et/ou nom sont renseignés
    const first = (target.firstName || '').trim();
    const last = (target.lastName || '').trim();
    if (first || last) {
      return `${first} ${last}`.trim();
    }

    // 2. Si le nom d'utilisateur est une adresse email (ex: Booba123@gmail.com)
    if (target.username) {
      if (target.username.includes('@')) {
        const localPart = target.username.split('@')[0];
        return localPart
          .replace(/[._-]/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      return target.username;
    }

    return 'Utilisateur';
  }

  getRoleLabel(role?: string): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrateur';
      case 'COMPANY_OWNER': return 'Propriétaire';
      case 'MANAGER': return 'Gérant de Boutique';
      case 'SELLER': return 'Vendeur';
      case 'TECHNICIAN': return 'Technicien SAV';
      case 'REPAIRER': return 'Réparateur SAV';
      default: return role || 'Employé';
    }
  }
}
