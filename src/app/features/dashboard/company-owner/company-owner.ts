import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { CompanyService } from '../../../core/services/company.service';
import { ShopService } from '../../../core/services/shop.service';
import { UserService } from '../../../core/services/user.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { SaleService } from '../../../core/services/sale.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Company } from '../../../core/services/company.model';
import { Shop } from '../../../core/services/shop.model';
import { User, UserRole } from '../../../core/services/user.model';
import { Stats } from '../../../core/services/stats.model';
import { Sale } from '../../../core/services/sale.model';

@Component({
  selector: 'app-company-owner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FcfaPipe],
  templateUrl: './company-owner.html',
  styleUrls: ['./company-owner.css']
})
export class CompanyOwnerComponent implements OnInit {
  companies: Company[] = [];
  selectedCompanyId: number | null = null;

  shops: Shop[] = [];
  users: User[] = [];
  sales: Sale[] = [];

  stats: Stats | null = null;
  currentUser: any = null;

  // Changement de mot de passe
  showPasswordModal: boolean = false;
  oldPasswordInput: string = '';
  newPasswordInput: string = '';
  passwordSuccess: string = '';
  passwordError: string = '';

  // Formulaire Nouvelle Boutique
  newShopName: string = '';
  newShopAddress: string = '';

  // Formulaire Nouvel Employé
  newUsername: string = '';
  newPassword: string = '';
  newRole: UserRole = 'SELLER';
  selectedShopId: number | null = null;

  constructor(
    private companyService: CompanyService,
    private shopService: ShopService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private saleService: SaleService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();

    this.companyService.getCompanies().subscribe({
      next: (data) => {
        this.companies = data;

        if (this.currentUser && this.currentUser.companyId) {
          this.selectedCompanyId = this.currentUser.companyId;
        } else if (this.companies.length > 0) {
          this.selectedCompanyId = this.companies[0].id!;
        }

        if (this.selectedCompanyId) {
          this.onCompanyChange();
        }
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement entreprises' });
      }
    });
  }

  onCompanyChange(): void {
    if (!this.selectedCompanyId) return;

    this.shopService.getShopsByCompany(this.selectedCompanyId).subscribe({
      next: (data) => {
        this.shops = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement boutiques' });
      }
    });

    this.userService.getUsersByCompany(this.selectedCompanyId).subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement employés' });
      }
    });

    this.saleService.getSalesByCompany(this.selectedCompanyId).subscribe({
      next: (data) => {
        this.sales = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur ventes' });
      }
    });

    this.dashboardService.getCompanyStats(this.selectedCompanyId).subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur statistiques' });
      }
    });
  }

  getShopName(shopId?: number): string {
    if (!shopId) return 'Toutes les boutiques';
    const shop = this.shops.find(s => s.id === shopId);
    return shop ? shop.name : `Boutique #${shopId}`;
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.oldPasswordInput = '';
    this.newPasswordInput = '';
    this.passwordSuccess = '';
    this.passwordError = '';
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  submitChangePassword(): void {
    if (!this.currentUser || !this.currentUser.id || !this.oldPasswordInput.trim() || !this.newPasswordInput.trim()) {
      this.toastService.warning('Veuillez saisir votre ancien et nouveau mot de passe');
      return;
    }

    this.userService.changePassword(
      this.currentUser.id,
      this.oldPasswordInput,
      this.newPasswordInput
    ).subscribe({
      next: () => {
        this.toastService.success('Votre mot de passe a été modifié avec succès !', {
          title: '🔐 Mot de passe mis à jour'
        });
        this.showPasswordModal = false;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur mot de passe' });
      }
    });
  }

  createShop(): void {
    if (!this.newShopName.trim()) {
      this.toastService.warning('Veuillez renseigner le nom de la boutique.');
      return;
    }
    if (!this.selectedCompanyId) {
      this.toastService.error('Aucune entreprise sélectionnée.');
      return;
    }

    const name = this.newShopName.trim();

    this.shopService.createShop({
      name: name,
      address: this.newShopAddress.trim(),
      companyId: this.selectedCompanyId
    }).subscribe({
      next: (data) => {
        this.shops.push(data);
        this.toastService.success(`Boutique '${data.name}' créée avec succès !`);
        this.newShopName = '';
        this.newShopAddress = '';
        this.onCompanyChange();
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur création boutique' });
      }
    });
  }

  createUser(): void {
    if (!this.newUsername.trim()) {
      this.toastService.warning('Veuillez renseigner un identifiant pour l\'employé.');
      return;
    }
    if (!this.newPassword.trim()) {
      this.toastService.warning('Veuillez définir un mot de passe temporaire.');
      return;
    }
    if (!this.selectedCompanyId) {
      this.toastService.error('Aucune entreprise sélectionnée.');
      return;
    }

    const username = this.newUsername.trim();
    const role = this.newRole;

    this.userService.createUser({
      username: username,
      password: this.newPassword.trim(),
      role: role,
      companyId: this.selectedCompanyId,
      shopId: this.selectedShopId || undefined
    }).subscribe({
      next: (data) => {
        this.users.push(data);
        this.toastService.success(
          `Compte '${data.username}' (${data.role}) créé avec succès ! Un email avec ses identifiants a été préparé.`
        );
        this.newUsername = '';
        this.newPassword = '';
        this.selectedShopId = null;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur création employé' });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Vous êtes déconnecté.', { duration: 2500 });
    this.router.navigate(['/login']);
  }
}

