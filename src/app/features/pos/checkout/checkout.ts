import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FcfaPipe, formatFCFA } from '../../../shared/pipes/fcfa.pipe';
import { CompanyService } from '../../../core/services/company.service';
import { ShopService } from '../../../core/services/shop.service';
import { UserService } from '../../../core/services/user.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { SaleService } from '../../../core/services/sale.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReceiptService, ReceiptData } from '../../../core/services/receipt.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
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
  imports: [CommonModule, FormsModule, RouterModule, FcfaPipe],
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
    private toastService: ToastService,
    private receiptService: ReceiptService,
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
        if (this.currentUser && this.currentUser.shopId) {
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

    this.userService.getUsersByShop(this.selectedShopId).subscribe({
      next: (data) => {
        this.sellers = data;
        if (this.currentUser) {
          this.selectedSellerId = this.currentUser.id;
        } else if (this.sellers.length > 0) {
          this.selectedSellerId = this.sellers[0].id!;
        }
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Erreur chargement vendeurs' });
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
      this.toastService.warning(`L'article '${item.productName}' est en rupture dans cette boutique. Vérification réseau en cours...`);
      this.openNetworkStockModal(item);
      return;
    }

    const existingItem = this.cart.find(c => c.productId === item.productId);
    if (existingItem) {
      if (existingItem.quantity >= item.quantity) {
        this.toastService.warning(`Stock maximum disponible atteint en boutique (${item.quantity} unités pour ${item.productName}) !`);
        return;
      }
      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      this.toastService.info(`Quantité de '${item.productName}' passée à ${existingItem.quantity}.`, { duration: 2500 });
    } else {
      this.cart.push({
        productId: item.productId,
        productName: item.productName,
        quantity: 1,
        unitPrice: item.sellingPrice,
        totalPrice: item.sellingPrice
      });
      this.toastService.success(`'${item.productName}' ajouté au panier.`, { duration: 2500 });
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
      error: (err) => {
        this.networkInventories = [];
        this.loadingNetwork = false;
        this.toastService.error(err, { title: 'Erreur réseau de stock' });
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
      this.toastService.warning(`Stock maximum disponible atteint en boutique (${maxQty} unités) !`);
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
    const removed = this.cart.splice(index, 1);
    if (removed.length > 0) {
      this.toastService.info(`'${removed[0].productName}' retiré du panier.`, { duration: 2500 });
    }
  }

  async clearCart(): Promise<void> {
    if (this.cart.length === 0) return;
    const confirmed = await this.confirmDialogService.confirm({
      title: 'Vider le panier',
      message: 'Voulez-vous vraiment retirer tous les articles du panier ?',
      confirmText: 'Vider le panier',
      cancelText: 'Conserver',
      type: 'warning'
    });
    if (confirmed) {
      this.cart = [];
      this.toastService.info('Le panier a été vidé.', { duration: 2500 });
    }
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  validateSale(): void {
    if (this.cart.length === 0) {
      this.toastService.error('Votre panier est vide. Veuillez ajouter au moins un produit avant de valider la vente.');
      return;
    }

    if (!this.selectedCompanyId || !this.selectedShopId || !this.selectedSellerId) {
      this.toastService.error('Veuillez vous assurer qu\'une boutique et un vendeur valide sont sélectionnés.');
      return;
    }

    const currentShop = this.shops.find(s => s.id === this.selectedShopId);
    const currentCompany = this.companies.find(c => c.id === this.selectedCompanyId);
    const currentSeller = this.sellers.find(u => u.id === this.selectedSellerId);

    // Save copy of cart items for the receipt before resetting cart
    const receiptItems = this.cart.map(item => ({
      productName: item.productName || 'Article',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice
    }));
    const totalAmount = this.getTotal();
    const paymentLabel = this.getPaymentLabel(this.paymentMethod);

    const companyNameResolved = currentCompany?.name
      || this.currentUser?.companyName
      || (this.companies.length > 0 ? this.companies[0].name : '')
      || 'Entreprise';

    this.saleService.processSale({
      companyId: this.selectedCompanyId,
      shopId: this.selectedShopId,
      sellerId: this.selectedSellerId,
      paymentMethod: this.paymentMethod,
      items: this.cart
    }).subscribe({
      next: (sale) => {
        const receiptData: ReceiptData = {
          saleId: sale.id,
          ticketNumber: `TICK-${sale.id}`,
          date: new Date(),
          companyName: companyNameResolved,
          shopName: currentShop ? currentShop.name : 'Boutique',
          shopAddress: currentShop?.address || '',
          sellerName: currentSeller ? `${currentSeller.username} (${currentSeller.role})` : 'Vendeur Caisse',
          items: receiptItems,
          totalAmount: sale.totalAmount || totalAmount,
          paymentMethod: paymentLabel
        };

        // Toast de succès avec bouton d'action directe pour ré-ouvrir ou imprimer
        this.toastService.success(
          `Vente enregistrée avec succès ! (Montant : ${formatFCFA(sale.totalAmount || totalAmount)})`,
          {
            title: '🎉 Vente Validée',
            duration: 6000,
            action: {
              label: '🖨️ Imprimer le reçu / ticket',
              onClick: () => this.receiptService.openReceipt(receiptData)
            }
          }
        );

        // Ouvrir automatiquement la modale de reçu pour aperçu direct & impression
        this.receiptService.openReceipt(receiptData);

        this.cart = [];
        this.searchQuery = '';
        this.onShopChange();
      },
      error: (err) => {
        this.toastService.error(err, { title: 'Échec de la vente' });
      }
    });
  }

  private getPaymentLabel(method: string): string {
    switch (method) {
      case 'CASH': return '💵 Espèces';
      case 'ORANGE_MONEY': return '🍊 Orange Money';
      case 'MOOV_MONEY': return '📱 Moov Money';
      case 'WAVE': return '🌊 Wave';
      case 'CARD': return '💳 Carte Bancaire';
      default: return method;
    }
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Vous êtes déconnecté.', { duration: 2500 });
    this.router.navigate(['/login']);
  }
}

