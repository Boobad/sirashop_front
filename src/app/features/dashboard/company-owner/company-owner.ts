import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { ShopService } from '../../../core/services/shop.service';
import { UserService } from '../../../core/services/user.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { SaleService } from '../../../core/services/sale.service';
import { AuthService } from '../../../core/services/auth.service';
import { Company } from '../../../core/services/company.model';
import { Shop } from '../../../core/services/shop.model';
import { User, UserRole } from '../../../core/services/user.model';
import { Stats } from '../../../core/services/stats.model';
import { Sale } from '../../../core/services/sale.model';

@Component({
  selector: 'app-company-owner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();

    this.companyService.getCompanies().subscribe(data => {
      this.companies = data;

      if (this.currentUser && this.currentUser.companyId) {
        this.selectedCompanyId = this.currentUser.companyId;
      } else if (this.companies.length > 0) {
        this.selectedCompanyId = this.companies[0].id!;
      }

      if (this.selectedCompanyId) {
        this.onCompanyChange();
      }
    });
  }

  onCompanyChange(): void {
    if (!this.selectedCompanyId) return;

    this.shopService.getShopsByCompany(this.selectedCompanyId).subscribe(data => {
      this.shops = data;
    });

    this.userService.getUsersByCompany(this.selectedCompanyId).subscribe(data => {
      this.users = data;
    });

    this.saleService.getSalesByCompany(this.selectedCompanyId).subscribe(data => {
      this.sales = data;
    });

    this.dashboardService.getCompanyStats(this.selectedCompanyId).subscribe(data => {
      this.stats = data;
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
      this.passwordError = 'Veuillez saisir votre ancien et nouveau mot de passe';
      return;
    }

    this.userService.changePassword(
      this.currentUser.id,
      this.oldPasswordInput,
      this.newPasswordInput
    ).subscribe({
      next: () => {
        this.passwordSuccess = '✅ Votre mot de passe a été modifié avec succès !';
        this.passwordError = '';
        setTimeout(() => {
          this.showPasswordModal = false;
          this.passwordSuccess = '';
        }, 2000);
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'L\'ancien mot de passe est incorrect';
        this.passwordSuccess = '';
      }
    });
  }

  createShop(): void {
    if (!this.newShopName.trim() || !this.selectedCompanyId) return;

    this.shopService.createShop({
      name: this.newShopName,
      address: this.newShopAddress,
      companyId: this.selectedCompanyId
    }).subscribe(data => {
      this.shops.push(data);
      this.newShopName = '';
      this.newShopAddress = '';
      this.onCompanyChange();
    });
  }

  createUser(): void {
    if (!this.newUsername.trim() || !this.newPassword.trim() || !this.selectedCompanyId) return;

    this.userService.createUser({
      username: this.newUsername,
      password: this.newPassword,
      role: this.newRole,
      companyId: this.selectedCompanyId,
      shopId: this.selectedShopId || undefined
    }).subscribe(data => {
      this.users.push(data);
      this.newUsername = '';
      this.newPassword = '';
      this.selectedShopId = null;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
