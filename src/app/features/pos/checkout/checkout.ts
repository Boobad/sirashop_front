import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { ShopService } from '../../../core/services/shop.service';
import { UserService } from '../../../core/services/user.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { SaleService } from '../../../core/services/sale.service';
import { AuthService } from '../../../core/services/auth.service';
import { Company } from '../../../core/services/company.model';
import { Shop } from '../../../core/services/shop.model';
import { User } from '../../../core/services/user.model';
import { Inventory } from '../../../core/services/inventory.model';
import { Product } from '../../../core/services/product.model';
import { SaleItem } from '../../../core/services/sale.model';

export interface DisplayProductItem {
  productId: number;
  productName: string;
  sellingPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit {
  companies: Company[] = [];
  selectedCompanyId: number | null = null;

  shops: Shop[] = [];
  selectedShopId: number | null = null;

  sellers: User[] = [];
  selectedSellerId: number | null = null;

  inventories: Inventory[] = [];
  products: Product[] = [];
  currentUser: any = null;

  // Recherche d'articles
  searchQuery: string = '';

  // Panier
  cart: SaleItem[] = [];
  paymentMethod: string = 'CASH';

  successMessage: string = '';
  errorMessage: string = '';

  // Modal Vérification Stock Inter-Boutiques (Réseau)
  showNetworkModal: boolean = false;
  selectedProductForNetwork: DisplayProductItem | null = null;
  networkInventories: Inventory[] = [];
  loadingNetwork: boolean = false;

  constructor(
    private companyService: CompanyService,
    private shopService: ShopService,
    private userService: UserService,
    private inventoryService: InventoryService,
    private productService: ProductService,
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

    this.productService.getProductsByCompany(this.selectedCompanyId).subscribe(data => {
      this.products = data;
    });

    this.shopService.getShopsByCompany(this.selectedCompanyId).subscribe(data => {
      this.shops = data;
      if (this.currentUser && this.currentUser.shopId) {
        this.selectedShopId = this.currentUser.shopId;
      } else if (this.shops.length > 0) {
        this.selectedShopId = this.shops[0].id!;
      }

      if (this.selectedShopId) {
        this.onShopChange();
      }
    });
  }

  onShopChange(): void {
    if (!this.selectedShopId) return;

    this.inventoryService.getInventoryByShop(this.selectedShopId).subscribe(data => {
      this.inventories = data;
    });

    this.userService.getUsersByShop(this.selectedShopId).subscribe(data => {
      this.sellers = data;
      if (this.currentUser) {
        this.selectedSellerId = this.currentUser.id;
      } else if (this.sellers.length > 0) {
        this.selectedSellerId = this.sellers[0].id!;
      }
    });

    this.cart = [];
  }

  // Liste complète de TOUS les produits du catalogue avec leur stock dans la boutique sélectionnée
  get displayProducts(): DisplayProductItem[] {
    const list: DisplayProductItem[] = this.products.map(p => {
      const inv = this.inventories.find(i => i.productId === p.id);
      return {
        productId: p.id!,
        productName: p.name,
        sellingPrice: p.sellingPrice,
        quantity: inv ? inv.quantity : 0
      };
    });

    if (!this.searchQuery.trim()) {
      return list;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return list.filter(item => item.productName.toLowerCase().includes(q));
  }

  addToCart(item: DisplayProductItem): void {
    if (item.quantity <= 0) {
      this.openNetworkStockModal(item);
      return;
    }

    const existingItem = this.cart.find(c => c.productId === item.productId);
    if (existingItem) {
      if (existingItem.quantity >= item.quantity) {
        this.errorMessage = `Stock maximum disponible atteint en boutique (${item.quantity} unités) !`;
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }
      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      this.cart.push({
        productId: item.productId,
        productName: item.productName,
        quantity: 1,
        unitPrice: item.sellingPrice,
        totalPrice: item.sellingPrice
      });
    }
  }

  openNetworkStockModal(item: DisplayProductItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedProductForNetwork = item;
    this.showNetworkModal = true;
    this.loadingNetwork = true;

    this.inventoryService.getNetworkStockByProduct(item.productId).subscribe({
      next: (data) => {
        this.networkInventories = data;
        this.loadingNetwork = false;
      },
      error: () => {
        this.networkInventories = [];
        this.loadingNetwork = false;
      }
    });
  }

  closeNetworkModal(): void {
    this.showNetworkModal = false;
    this.selectedProductForNetwork = null;
    this.networkInventories = [];
  }

  increaseQty(item: SaleItem): void {
    const inv = this.inventories.find(i => i.productId === item.productId);
    const maxQty = inv ? inv.quantity : 0;
    if (item.quantity >= maxQty) {
      this.errorMessage = `Stock maximum disponible atteint en boutique (${maxQty} unités) !`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    item.quantity += 1;
    item.totalPrice = item.quantity * item.unitPrice;
  }

  decreaseQty(item: SaleItem, index: number): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
      item.totalPrice = item.quantity * item.unitPrice;
    } else {
      this.removeFromCart(index);
    }
  }

  updateItemPrice(item: SaleItem): void {
    item.totalPrice = item.quantity * item.unitPrice;
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  validateSale(): void {
    if (this.cart.length === 0 || !this.selectedCompanyId || !this.selectedShopId || !this.selectedSellerId) {
      this.errorMessage = 'Veuillez sélectionner un vendeur, une boutique et au moins 1 article.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.saleService.processSale({
      companyId: this.selectedCompanyId,
      shopId: this.selectedShopId,
      sellerId: this.selectedSellerId,
      paymentMethod: this.paymentMethod,
      items: this.cart
    }).subscribe({
      next: (sale) => {
        this.successMessage = `🎉 Vente #${sale.id} validée ! Montant Total: ${sale.totalAmount} FCFA`;
        this.cart = [];
        this.searchQuery = '';
        this.onShopChange();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la validation de la vente';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
