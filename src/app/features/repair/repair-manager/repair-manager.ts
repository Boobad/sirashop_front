import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { UserService } from '../../../core/services/user.service';
import { RepairService } from '../../../core/services/repair.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shop } from '../../../core/services/shop.model';
import { User } from '../../../core/services/user.model';
import { RepairTicket, RepairStatus } from '../../../core/services/repair.model';

@Component({
  selector: 'app-repair-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './repair-manager.html',
  styleUrls: ['./repair-manager.css']
})
export class RepairManagerComponent implements OnInit {
  shops: Shop[] = [];
  selectedShopId: number | null = null;

  technicians: User[] = [];
  selectedTechnicianId: number | null = null;

  tickets: RepairTicket[] = [];
  currentUser: any = null;

  // Form Nouveau Ticket SAV
  customerName: string = '';
  customerPhone: string = '';
  deviceModel: string = '';
  issueDescription: string = '';
  estimatedPrice: number | null = null;
  depositAmount: number | null = null;

  statuses = [
    { value: 'RECEIVED', label: '📥 Reçu (En attente)' },
    { value: 'DIAGNOSING', label: '🔍 Diag & Devis' },
    { value: 'IN_PROGRESS', label: '⚡ En cours de Réparation' },
    { value: 'REPAIRED', label: '✅ Réparé (Prêt)' },
    { value: 'DELIVERED', label: '🎉 Livré au Client' },
    { value: 'CANCELLED', label: '❌ Annulé / Irréparable' }
  ];

  constructor(
    private shopService: ShopService,
    private userService: UserService,
    private repairService: RepairService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();

    if (this.currentUser && this.currentUser.companyId) {
      this.shopService.getShopsByCompany(this.currentUser.companyId).subscribe(data => {
        this.shops = data;
        if (this.currentUser.shopId) {
          this.selectedShopId = this.currentUser.shopId;
        } else if (this.shops.length > 0) {
          this.selectedShopId = this.shops[0].id!;
        }

        if (this.selectedShopId) {
          this.onShopChange();
        }
      });
    }
  }

  onShopChange(): void {
    if (!this.selectedShopId) return;

    this.repairService.getTicketsByShop(this.selectedShopId).subscribe(data => {
      this.tickets = data;
    });

    this.userService.getUsersByShop(this.selectedShopId).subscribe(data => {
      this.technicians = data.filter(u => u.role === 'TECHNICIAN' || u.role === 'COMPANY_OWNER');
    });
  }

  createTicket(): void {
    if (!this.customerName.trim() || !this.deviceModel.trim() || !this.selectedShopId) return;

    this.repairService.createTicket({
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      deviceModel: this.deviceModel,
      issueDescription: this.issueDescription,
      estimatedPrice: this.estimatedPrice || 0,
      depositAmount: this.depositAmount || 0,
      shopId: this.selectedShopId,
      technicianId: this.selectedTechnicianId || undefined
    }).subscribe(ticket => {
      this.tickets.unshift(ticket);

      this.customerName = '';
      this.customerPhone = '';
      this.deviceModel = '';
      this.issueDescription = '';
      this.estimatedPrice = null;
      this.depositAmount = null;
      this.selectedTechnicianId = null;
    });
  }

  onStatusChange(ticket: RepairTicket, event: any): void {
    const newStatus = event.target.value as RepairStatus;
    if (!ticket.id) return;

    this.repairService.updateStatus(ticket.id, newStatus).subscribe((updated: RepairTicket) => {
      ticket.status = updated.status;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
