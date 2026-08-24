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
  newOwnerUsername: string = '';
  newOwnerPassword: string = '';

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
    if (!this.newOwnerUsername.trim()) {
      this.toastService.warning('Veuillez définir un identifiant pour le Propriétaire (Boss).');
      return;
    }
    if (!this.newOwnerPassword.trim()) {
      this.toastService.warning('Veuillez saisir un mot de passe par défaut.');
      return;
    }

    this.companyService.createCompanyWithOwner({
      companyName: this.newCompanyName.trim(),
      ownerUsername: this.newOwnerUsername.trim(),
      ownerPassword: this.newOwnerPassword.trim()
    }).subscribe({
      next: (data) => {
        this.companies.push(data);
        this.toastService.success(
          `Compte créé ! Un email avec les identifiants pour l'entreprise '${data.name}' (${this.newOwnerUsername}) a été préparé.`,
          { title: '🎉 Inscription Réussie', duration: 6000 }
        );
        
        this.newCompanyName = '';
        this.newOwnerUsername = '';
        this.newOwnerPassword = '';
        this.loadStats();
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Échec de la création d\'entreprise' });
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
    if (!this.newAdminUsername.trim() || !this.newAdminPassword.trim()) {
      this.toastService.warning('Veuillez renseigner un identifiant et un mot de passe.');
      return;
    }

    this.superAdminService.createSuperAdmin({
      username: this.newAdminUsername.trim(),
      password: this.newAdminPassword.trim()
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

