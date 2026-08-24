import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FcfaPipe, formatFCFA } from '../../../shared/pipes/fcfa.pipe';
import { ShopService } from '../../../core/services/shop.service';
import { UserService } from '../../../core/services/user.service';
import { RepairService } from '../../../core/services/repair.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Shop } from '../../../core/services/shop.model';
import { User } from '../../../core/services/user.model';
import { RepairTicket, RepairStatus } from '../../../core/services/repair.model';

@Component({
  selector: 'app-repair-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FcfaPipe],
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
    { value: 'RECEIVED', label: '📥 En attente (Reçu)' },
    { value: 'DIAGNOSING', label: '🔍 Diagnostic & Devis' },
    { value: 'IN_PROGRESS', label: '⚡ En cours de réparation' },
    { value: 'REPAIRED', label: '✅ Réparé / Prêt pour retrait' },
    { value: 'DELIVERED', label: '🎉 Livré au client' },
    { value: 'CANCELLED', label: '❌ Annulé' }
  ];

  // Versement / Modal de paiement
  showPaymentModal: boolean = false;
  activePaymentTicket: RepairTicket | null = null;
  paymentMode: 'ADDITIONAL' | 'SET_DEPOSIT' = 'ADDITIONAL';
  paymentInputValue: number | null = null;
  paymentSuccessMsg: string = '';
  paymentErrorMsg: string = '';

  constructor(
    private shopService: ShopService,
    private userService: UserService,
    private repairService: RepairService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();

    if (this.currentUser && this.currentUser.companyId) {
      this.shopService.getShopsByCompany(this.currentUser.companyId).subscribe({
        next: (data) => {
          this.shops = data;
          if (this.currentUser.shopId) {
            this.selectedShopId = this.currentUser.shopId;
          } else if (this.shops.length > 0) {
            this.selectedShopId = this.shops[0].id!;
          }

          if (this.selectedShopId) {
            this.onShopChange();
          }
        },
        error: (err) => {
          this.toastService.error(err, { title: 'Erreur chargement boutiques' });
        }
      });
    }
  }

  onShopChange(): void {
    if (!this.selectedShopId) return;

    this.repairService.getTicketsByShop(this.selectedShopId).subscribe({
      next: (data) => {
        this.tickets = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement tickets SAV' });
      }
    });

    this.userService.getUsersByShop(this.selectedShopId).subscribe({
      next: (data) => {
        this.technicians = data.filter(u => u.role === 'TECHNICIAN' || u.role === 'COMPANY_OWNER');
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur techniciens' });
      }
    });
  }

  createTicket(): void {
    if (!this.customerName.trim()) {
      this.toastService.warning('Veuillez renseigner le nom du client.');
      return;
    }
    if (!this.deviceModel.trim()) {
      this.toastService.warning('Veuillez spécifier le modèle de l\'appareil (ex: iPhone 12, Samsung A52...).');
      return;
    }
    if (!this.selectedShopId) {
      this.toastService.error('Veuillez sélectionner un atelier / boutique valide.');
      return;
    }

    this.repairService.createTicket({
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone.trim(),
      deviceModel: this.deviceModel.trim(),
      issueDescription: this.issueDescription.trim(),
      estimatedPrice: this.estimatedPrice || 0,
      depositAmount: this.depositAmount || 0,
      shopId: this.selectedShopId,
      technicianId: this.selectedTechnicianId || undefined
    }).subscribe({
      next: (ticket) => {
        this.tickets.unshift(ticket);
        this.toastService.success(
          `Ticket #${ticket.id} créé avec succès pour ${ticket.customerName} (${ticket.deviceModel}) !`,
          { title: '🛠️ Ticket SAV Enregistré', duration: 5000 }
        );

        this.customerName = '';
        this.customerPhone = '';
        this.deviceModel = '';
        this.issueDescription = '';
        this.estimatedPrice = null;
        this.depositAmount = null;
        this.selectedTechnicianId = null;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur création ticket' });
      }
    });
  }

  onStatusChange(ticket: RepairTicket, event: any): void {
    const newStatus = event.target.value as RepairStatus;
    if (!ticket.id) return;

    const statusObj = this.statuses.find(s => s.value === newStatus);

    this.repairService.updateStatus(ticket.id, newStatus).subscribe({
      next: (updated: RepairTicket) => {
        ticket.status = updated.status;
        this.toastService.info(
          `Statut du ticket #${ticket.id} mis à jour : ${statusObj?.label || newStatus}`,
          { title: '⚡ Statut SAV Actualisé', duration: 3500 }
        );
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur changement de statut' });
      }
    });
  }

  payInFull(ticket: RepairTicket): void {
    if (!ticket.id) return;
    this.repairService.updatePayment(ticket.id, { payInFull: true }).subscribe({
      next: (updatedTicket: RepairTicket) => {
        ticket.depositAmount = updatedTicket.depositAmount;
        ticket.estimatedPrice = updatedTicket.estimatedPrice;
        this.toastService.success(`Règlement intégral enregistré pour le ticket #${ticket.id} (${formatFCFA(ticket.estimatedPrice)} - Solde réglé).`);
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur règlement intégral' });
      }
    });
  }

  openPaymentModal(ticket: RepairTicket): void {
    this.activePaymentTicket = ticket;
    this.showPaymentModal = true;
    this.paymentMode = 'ADDITIONAL';
    this.paymentInputValue = null;
    this.paymentSuccessMsg = '';
    this.paymentErrorMsg = '';
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.activePaymentTicket = null;
  }

  submitPaymentUpdate(): void {
    if (!this.activePaymentTicket || !this.activePaymentTicket.id || !this.paymentInputValue || this.paymentInputValue <= 0) {
      this.toastService.warning('Veuillez saisir un montant supérieur à 0.');
      return;
    }

    const payload = this.paymentMode === 'ADDITIONAL' 
      ? { additionalPayment: this.paymentInputValue }
      : { depositAmount: this.paymentInputValue };

    const ticketId = this.activePaymentTicket.id;
    const amountVal = this.paymentInputValue;

    this.repairService.updatePayment(ticketId, payload).subscribe({
      next: (updatedTicket: RepairTicket) => {
        this.activePaymentTicket!.depositAmount = updatedTicket.depositAmount;
        this.activePaymentTicket!.estimatedPrice = updatedTicket.estimatedPrice;
        
        this.toastService.success(
          `Versement de ${formatFCFA(amountVal)} validé pour le ticket #${ticketId}. (Acompte total : ${formatFCFA(updatedTicket.depositAmount)})`
        );

        this.closePaymentModal();
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur mise à jour versement' });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Vous êtes déconnecté.', { duration: 2500 });
    this.router.navigate(['/login']);
  }
}

