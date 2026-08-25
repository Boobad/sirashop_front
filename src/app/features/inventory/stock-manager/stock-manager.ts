import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { CompanyService } from '../../../core/services/company.service';
import { ShopService } from '../../../core/services/shop.service';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Company } from '../../../core/services/company.model';
import { Shop } from '../../../core/services/shop.model';
import { Product } from '../../../core/services/product.model';
import { Inventory } from '../../../core/services/inventory.model';

@Component({
  selector: 'app-stock-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FcfaPipe],
  templateUrl: './stock-manager.html',
  styleUrls: ['./stock-manager.css']
})
export class StockManagerComponent implements OnInit {
  companies: Company[] = [];
  selectedCompanyId: number | null = null;

  shops: Shop[] = [];
  selectedShopId: number | null = null;

  products: Product[] = [];
  inventories: Inventory[] = [];
  currentUser: any = null;

  // Form Nouveau Produit (Catalogue)
  newProductName: string = '';
  newPurchasePrice: number | null = null;
  newSellingPrice: number | null = null;
  newInitialQuantity: number = 50;

  // Form Ajuster le Stock existant
  selectedProductId: number | null = null;
  stockQuantity: number = 10;
  alertThreshold: number = 5;

  constructor(
    private companyService: CompanyService,
    private shopService: ShopService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router
  ) {}

  hasSales(): boolean {
    return this.authService.hasSales();
  }

  hasRepairs(): boolean {
    return this.authService.hasRepairs();
  }

  getUserDisplayName(user?: any): string {
    return this.authService.getUserDisplayName(user || this.currentUser);
  }

  getRoleLabel(role?: string): string {
    return this.authService.getRoleLabel(role || this.currentUser?.role);
  }

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

    this.productService.getProductsByCompany(this.selectedCompanyId).subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur catalogue' });
      }
    });

    this.shopService.getShopsByCompany(this.selectedCompanyId).subscribe({
      next: (data) => {
        this.shops = data;
        if (this.shops.length > 0) {
          this.selectedShopId = this.shops[0].id!;
          this.onShopChange();
        } else {
          this.inventories = [];
        }
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement boutiques' });
      }
    });
  }

  onShopChange(): void {
    if (!this.selectedShopId) return;

    this.inventoryService.getInventoryByShop(this.selectedShopId).subscribe({
      next: (data) => {
        this.inventories = data;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur inventaire' });
      }
    });
  }

  createProduct(): void {
    if (!this.newProductName.trim()) {
      this.toastService.warning('Veuillez renseigner le nom de l\'article.');
      return;
    }
    if (!this.newSellingPrice || this.newSellingPrice <= 0) {
      this.toastService.warning('Veuillez saisir un prix de vente valide.');
      return;
    }
    if (!this.selectedCompanyId) {
      this.toastService.error('Aucune entreprise sélectionnée.');
      return;
    }

    const productName = this.newProductName.trim();

    this.productService.createProduct({
      name: productName,
      purchasePrice: this.newPurchasePrice || 0,
      sellingPrice: this.newSellingPrice,
      companyId: this.selectedCompanyId
    }).subscribe({
      next: (product) => {
        this.products.push(product);
        this.toastService.success(`Le produit '${product.name}' a été ajouté avec succès.`);

        if (this.selectedShopId && this.newInitialQuantity > 0) {
          this.inventoryService.setStock(this.selectedShopId, product.id!, this.newInitialQuantity).subscribe(() => {
            this.onShopChange();
          });
        }

        this.newProductName = '';
        this.newPurchasePrice = null;
        this.newSellingPrice = null;
        this.newInitialQuantity = 50;
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Échec de création du produit' });
      }
    });
  }

  updateStock(): void {
    if (!this.selectedShopId || !this.selectedProductId) {
      this.toastService.warning('Veuillez sélectionner une boutique et un produit à mettre à jour.');
      return;
    }

    const prod = this.products.find(p => p.id === this.selectedProductId);
    const prodName = prod ? prod.name : 'Produit';

    this.inventoryService.setStock(
      this.selectedShopId,
      this.selectedProductId,
      this.stockQuantity,
      this.alertThreshold
    ).subscribe({
      next: () => {
        this.toastService.success(`Stock mis à jour pour '${prodName}' (${this.stockQuantity} unités).`);
        this.onShopChange();
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur mise à jour stock' });
      }
    });
  }

  async deleteProduct(product: Product, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    if (!product.id) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Suppression d\'un produit',
      message: `Êtes-vous sûr de vouloir supprimer le produit '${product.name}' du catalogue ? Cette action est irréversible.`,
      confirmText: 'Supprimer le produit',
      cancelText: 'Annuler',
      type: 'danger',
      icon: '🗑️'
    });

    if (!confirmed) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== product.id);
        this.toastService.success(`Le produit '${product.name}' a été supprimé avec succès.`);
        this.onShopChange();
      },
      error: (err) => {
        // Handle server failure or mock removal if backend has constraints
        this.toastService.error(err, { title: 'Erreur suppression' });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Vous êtes déconnecté.', { duration: 2500 });
    this.router.navigate(['/login']);
  }
}

