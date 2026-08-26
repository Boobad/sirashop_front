import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { CompanyService } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { SuperAdminService, SuperAdminStats, AdminUser, SubscriptionPayment } from '../../../core/services/super-admin.service';
import { Company } from '../../../core/services/company.model';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, FcfaPipe],
  templateUrl: './super-admin.html',
  styleUrls: ['./super-admin.css']
})
export class SuperAdminComponent implements OnInit {
  activeTab: 'companies' | 'stats' | 'payments' | 'admins' = 'companies';

  companies: Company[] = [];

  // Formulaire d'inscription Entreprise + Propriétaire
  newCompanyName: string = '';
  newOwnerName: string = '';
  newOwnerEmail: string = '';
  newPhone: string = '';
  newOwnerPassword: string = '';
  newHasSales: boolean = true;
  newHasRepairs: boolean = false;

  // Modale d'Édition d'Entreprise
  showEditCompanyModal: boolean = false;
  editingCompany: Company | null = null;
  editCompanyName: string = '';
  editOwnerName: string = '';
  editPhone: string = '';
  editHasSales: boolean = true;
  editHasRepairs: boolean = true;
  submittingEditCompany: boolean = false;
  editCompanyError: string = '';

  stats: SuperAdminStats | null = null;
  payments: SubscriptionPayment[] = [];

  // Formulaire de Règlement d'Abonnement
  selectedCompanyForPayment: Company | null = null;
  payAmount: number = 30000;
  payMonth: string = 'Août';
  payNotes: string = '';
  paymentErrorMsg: string = '';
  submittingPayment: boolean = false;

  admins: AdminUser[] = [];
  newAdminUsername: string = '';
  newAdminPassword: string = '';

  currentUser: any = null;

  months: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private companyService: CompanyService,
    private superAdminService: SuperAdminService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadCompanies();
    this.loadStats();
    this.loadPayments();
    this.loadAdmins();
  }

  getUserDisplayName(user?: any): string {
    return this.authService.getUserDisplayName(user || this.currentUser);
  }

  getRoleLabel(role?: string): string {
    return this.authService.getRoleLabel(role || this.currentUser?.role);
  }

  setTab(tab: 'companies' | 'stats' | 'payments' | 'admins'): void {
    this.activeTab = tab;
    if (tab === 'stats') this.loadStats();
    if (tab === 'payments') this.loadPayments();
    if (tab === 'admins') this.loadAdmins();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (data) => {
        this.companies = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement entreprises' });
      }
    });
  }

  loadStats(): void {
    this.superAdminService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement statistiques' });
      }
    });
  }

  loadPayments(): void {
    this.superAdminService.getAllPayments().subscribe({
      next: (data) => {
        this.payments = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur historique paiements' });
      }
    });
  }

  loadAdmins(): void {
    this.superAdminService.getSuperAdmins().subscribe({
      next: (data) => {
        this.admins = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement administrateurs' });
      }
    });
  }

  createCompany(): void {
    if (!this.newCompanyName.trim()) {
      this.toastService.warning('Veuillez renseigner le nom de l\'entreprise.');
      return;
    }
    if (!this.newPhone.trim()) {
      this.toastService.warning('Le numéro de téléphone est obligatoire.');
      return;
    }
    const cleanPhone = this.newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      this.toastService.warning('Le numéro de téléphone doit comporter au moins 8 chiffres.');
      return;
    }
    if (!this.newOwnerName.trim()) {
      this.toastService.warning('Veuillez renseigner le nom et prénom du propriétaire.');
      return;
    }
    if (!this.newOwnerEmail.trim()) {
      this.toastService.warning('L\'adresse email du propriétaire est obligatoire.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newOwnerEmail.trim())) {
      this.toastService.warning('Veuillez renseigner une adresse email valide (ex: contact@entreprise.ml).');
      return;
    }

    this.companyService.createCompanyWithOwner({
      companyName: this.newCompanyName.trim(),
      phone: this.newPhone.trim(),
      ownerName: this.newOwnerName.trim(),
      ownerEmail: this.newOwnerEmail.trim(),
      ownerPassword: this.newOwnerPassword.trim() || undefined,
      hasSalesEnabled: this.newHasSales,
      hasRepairsEnabled: this.newHasRepairs
    }).subscribe({
      next: (data) => {
        this.companies.push(data);
        this.toastService.success(
          `Compte créé ! L'entreprise '${data.name}' a été inscrite avec succès.`,
          { title: '🎉 Inscription Réussie', duration: 6000 }
        );
        
        this.newCompanyName = '';
        this.newPhone = '';
        this.newOwnerName = '';
        this.newOwnerEmail = '';
        this.newOwnerPassword = '';
        this.newHasSales = true;
        this.newHasRepairs = false;
        this.loadStats();
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Échec de la création d\'entreprise' });
      }
    });
  }

  openEditCompanyModal(c: Company): void {
    this.editingCompany = c;
    this.editCompanyName = c.name;
    this.editOwnerName = c.ownerName || '';
    this.editPhone = c.phone || '';
    this.editHasSales = c.hasSalesEnabled !== false;
    this.editHasRepairs = c.hasRepairsEnabled !== false;
    this.editCompanyError = '';
    this.showEditCompanyModal = true;
  }

  closeEditCompanyModal(): void {
    this.showEditCompanyModal = false;
    this.editingCompany = null;
    this.editCompanyError = '';
  }

  submitEditCompany(): void {
    if (!this.editingCompany || !this.editingCompany.id) return;
    if (!this.editCompanyName.trim()) {
      this.editCompanyError = 'Le nom de l\'entreprise est obligatoire.';
      return;
    }

    this.submittingEditCompany = true;
    this.editCompanyError = '';

    const updatePayload: Partial<Company> = {
      name: this.editCompanyName.trim(),
      ownerName: this.editOwnerName.trim() || undefined,
      phone: this.editPhone.trim() || undefined,
      hasSalesEnabled: this.editHasSales,
      hasRepairsEnabled: this.editHasRepairs
    };

    this.companyService.updateCompany(this.editingCompany.id, updatePayload).subscribe({
      next: (updated) => {
        this.submittingEditCompany = false;
        const idx = this.companies.findIndex(c => c.id === this.editingCompany!.id);
        if (idx !== -1) {
          this.companies[idx] = { ...this.companies[idx], ...updated, ...updatePayload };
        }
        this.toastService.success(`L'entreprise '${this.editCompanyName}' a été mise à jour avec succès !`);
        this.closeEditCompanyModal();
      },
      error: (err) => {
        this.submittingEditCompany = false;
        this.editCompanyError = typeof err === 'string' ? err : (err.error?.message || 'Erreur lors de la mise à jour');
        this.toastService.error(err, { title: 'Erreur modification entreprise' });
      }
    });
  }

  async toggleCompany(company: Company): Promise<void> {
    if (!company.id) return;

    if (company.active) {
      // Confirmation de suspension
      const confirmed = await this.confirmDialogService.confirm({
        title: 'Suspension d\'entreprise',
        message: `Voulez-vous vraiment suspendre l'accès de l'entreprise '${company.name}' ? Tous les accès utilisateurs de cette entreprise seront bloqués.`,
        confirmText: 'Suspendre l\'accès',
        cancelText: 'Annuler',
        type: 'danger',
        icon: '🛑'
      });

      if (!confirmed) return;

      this.companyService.toggleCompanyActive(company.id).subscribe({
        next: (updated) => {
          company.active = updated.active;
          this.toastService.warning(`L'entreprise '${company.name}' a été suspendue avec succès.`, {
            title: '🛑 Accès Suspendu'
          });
          this.loadStats();
        },
        error: (err) => {
          this.toastService.error(err, { title: 'Erreur lors de la suspension' });
        }
      });
    } else {
      // Réactivation
      this.companyService.toggleCompanyActive(company.id).subscribe({
        next: (updated) => {
          company.active = updated.active;
          this.toastService.success(`L'accès de l'entreprise '${company.name}' a été rétabli.`, {
            title: '✅ Entreprise Débloquée'
          });
          this.loadStats();
        },
        error: (err) => {
          this.toastService.error(err, { title: 'Erreur lors de la réactivation' });
        }
      });
    }
  }

  openPaymentModal(company: Company): void {
    this.selectedCompanyForPayment = company;
    this.payAmount = 30000;
    this.payMonth = 'Août';
    this.payNotes = '';
    this.paymentErrorMsg = '';
    this.submittingPayment = false;
  }

  cancelPayment(): void {
    this.selectedCompanyForPayment = null;
    this.paymentErrorMsg = '';
    this.submittingPayment = false;
  }

  submitPayment(): void {
    if (!this.selectedCompanyForPayment || !this.selectedCompanyForPayment.id || this.submittingPayment) return;

    const companyName = this.selectedCompanyForPayment.name;
    const month = this.payMonth;

    this.submittingPayment = true;
    this.paymentErrorMsg = '';

    this.superAdminService.recordPayment({
      companyId: this.selectedCompanyForPayment.id,
      amount: this.payAmount,
      periodMonth: this.payMonth,
      notes: this.payNotes
    }).subscribe({
      next: (data) => {
        this.submittingPayment = false;
        this.paymentErrorMsg = '';

        this.toastService.success(
          `Abonnement du mois de ${data.periodMonth} 2026 enregistré avec succès. L'entreprise est active.`,
          { title: '💳 Cotisation Enregistrée', duration: 5000 }
        );
        
        const comp = this.companies.find(c => c.id === this.selectedCompanyForPayment?.id);
        if (comp) comp.active = true;

        this.selectedCompanyForPayment = null;
        this.loadStats();
        this.loadPayments();
      },
      error: (err) => {
        this.submittingPayment = false;
        const msg = this.toastService.extractErrorMessage(
          err,
          `L'entreprise '${companyName}' a déjà réglé son abonnement pour le mois de ${month} 2026.`
        );
        this.paymentErrorMsg = msg;
      }
    });
  }

  createAdmin(): void {
    if (!this.newAdminUsername.trim()) {
      this.toastService.warning('Veuillez renseigner un identifiant pour le Super Admin.');
      return;
    }

    this.superAdminService.createSuperAdmin({
      username: this.newAdminUsername.trim(),
      password: this.newAdminPassword.trim() || undefined
    }).subscribe({
      next: (data) => {
        this.admins.push(data);
        this.toastService.success(`Compte Super Admin '${data.username}' créé avec succès !`);
        this.newAdminUsername = '';
        this.newAdminPassword = '';
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur création administrateur' });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Vous êtes déconnecté.', { duration: 2500 });
    this.router.navigate(['/login']);
  }
}

