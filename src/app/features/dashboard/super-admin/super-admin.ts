import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';
import { SuperAdminService, SuperAdminStats, AdminUser, SubscriptionPayment } from '../../../core/services/super-admin.service';
import { Company } from '../../../core/services/company.model';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './super-admin.html',
  styleUrls: ['./super-admin.css']
})
export class SuperAdminComponent implements OnInit {
  activeTab: 'companies' | 'stats' | 'payments' | 'admins' = 'companies';

  companies: Company[] = [];

  // Formulaire d'inscription Entreprise + Propriétaire
  newCompanyName: string = '';
  newOwnerUsername: string = '';
  newOwnerPassword: string = '';

  stats: SuperAdminStats | null = null;
  payments: SubscriptionPayment[] = [];

  // Formulaire de Règlement d'Abonnement
  selectedCompanyForPayment: Company | null = null;
  payAmount: number = 30000;
  payMonth: string = 'Août';
  payNotes: string = '';

  admins: AdminUser[] = [];
  newAdminUsername: string = '';
  newAdminPassword: string = '';

  currentUser: any = null;
  successMessage: string = '';

  months: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private companyService: CompanyService,
    private superAdminService: SuperAdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadCompanies();
    this.loadStats();
    this.loadPayments();
    this.loadAdmins();
  }

  setTab(tab: 'companies' | 'stats' | 'payments' | 'admins'): void {
    this.activeTab = tab;
    if (tab === 'stats') this.loadStats();
    if (tab === 'payments') this.loadPayments();
    if (tab === 'admins') this.loadAdmins();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe(data => {
      this.companies = data;
    });
  }

  loadStats(): void {
    this.superAdminService.getStats().subscribe(data => {
      this.stats = data;
    });
  }

  loadPayments(): void {
    this.superAdminService.getAllPayments().subscribe(data => {
      this.payments = data;
    });
  }

  loadAdmins(): void {
    this.superAdminService.getSuperAdmins().subscribe(data => {
      this.admins = data;
    });
  }

  createCompany(): void {
    if (!this.newCompanyName.trim() || !this.newOwnerUsername.trim() || !this.newOwnerPassword.trim()) {
      return;
    }

    this.companyService.createCompanyWithOwner({
      companyName: this.newCompanyName,
      ownerUsername: this.newOwnerUsername,
      ownerPassword: this.newOwnerPassword
    }).subscribe(data => {
      this.companies.push(data);
      this.successMessage = `🎉 Entreprise '${data.name}' créée avec son compte Propriétaire (${this.newOwnerUsername}) ! Mot de passe par défaut: ${this.newOwnerPassword}`;
      
      this.newCompanyName = '';
      this.newOwnerUsername = '';
      this.newOwnerPassword = '';
      this.loadStats();

      setTimeout(() => this.successMessage = '', 7000);
    });
  }

  toggleCompany(company: Company): void {
    if (!company.id) return;

    this.companyService.toggleCompanyActive(company.id).subscribe(updated => {
      company.active = updated.active;
      this.loadStats();
    });
  }

  openPaymentModal(company: Company): void {
    this.selectedCompanyForPayment = company;
    this.payAmount = 30000;
    this.payMonth = 'Août';
    this.payNotes = '';
  }

  cancelPayment(): void {
    this.selectedCompanyForPayment = null;
  }

  submitPayment(): void {
    if (!this.selectedCompanyForPayment || !this.selectedCompanyForPayment.id) return;

    this.superAdminService.recordPayment({
      companyId: this.selectedCompanyForPayment.id,
      amount: this.payAmount,
      periodMonth: this.payMonth,
      notes: this.payNotes
    }).subscribe(data => {
      this.successMessage = `🎉 Paiement de ${data.amount} FCFA enregistré pour ${this.selectedCompanyForPayment?.name} (${data.periodMonth}) ! Le compte est débloqué.`;
      
      const comp = this.companies.find(c => c.id === this.selectedCompanyForPayment?.id);
      if (comp) comp.active = true;

      this.selectedCompanyForPayment = null;
      this.loadStats();
      this.loadPayments();

      setTimeout(() => this.successMessage = '', 5000);
    });
  }

  createAdmin(): void {
    if (!this.newAdminUsername.trim() || !this.newAdminPassword.trim()) return;

    this.superAdminService.createSuperAdmin({
      username: this.newAdminUsername,
      password: this.newAdminPassword
    }).subscribe(data => {
      this.admins.push(data);
      this.newAdminUsername = '';
      this.newAdminPassword = '';
      this.successMessage = `✅ Administrateur '${data.username}' créé avec succès !`;
      setTimeout(() => this.successMessage = '', 4000);
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
