import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RepairTicket, RepairStatus } from './repair.model';

@Injectable({
  providedIn: 'root'
})
export class RepairService {
  private apiUrl = 'http://localhost:8085/api/repairs';

  constructor(private http: HttpClient) { }

  createTicket(ticket: Partial<RepairTicket>): Observable<RepairTicket> {
    return this.http.post<RepairTicket>(this.apiUrl, ticket);
  }

  updateStatus(ticketId: number, status: RepairStatus, technicianId?: number): Observable<RepairTicket> {
    return this.http.put<RepairTicket>(`${this.apiUrl}/${ticketId}/status`, {
      status,
      technicianId
    });
  }

  getTicketsByShop(shopId: number): Observable<RepairTicket[]> {
    return this.http.get<RepairTicket[]>(`${this.apiUrl}/shop/${shopId}`);
  }

  getTicketsByCompany(companyId: number): Observable<RepairTicket[]> {
    return this.http.get<RepairTicket[]>(`${this.apiUrl}/company/${companyId}`);
  }
}
