import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { ShopService } from '../../../core/services/shop.service';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';
import { Company } from '../../../core/services/company.model';
import { Shop } from '../../../core/services/shop.model';
import { Product } from '../../../core/services/product.model';
import { Inventory } from '../../../core/services/inventory.model';

@Component({
  selector: 'app-stock-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
      if (this.shops.length > 0) {
        this.selectedShopId = this.shops[0].id!;
        this.onShopChange();
      } else {
        this.inventories = [];
      }
    });
  }

  onShopChange(): void {
    if (!this.selectedShopId) return;

    this.inventoryService.getInventoryByShop(this.selectedShopId).subscribe(data => {
      this.inventories = data;
    });
  }

  createProduct(): void {
    if (!this.newProductName.trim() || !this.newSellingPrice || !this.selectedCompanyId) return;

    this.productService.createProduct({
      name: this.newProductName,
      purchasePrice: this.newPurchasePrice || 0,
      sellingPrice: this.newSellingPrice,
      companyId: this.selectedCompanyId
    }).subscribe(product => {
      this.products.push(product);

      if (this.selectedShopId && this.newInitialQuantity > 0) {
        this.inventoryService.setStock(this.selectedShopId, product.id!, this.newInitialQuantity).subscribe(() => {
          this.onShopChange();
        });
      }

      this.newProductName = '';
      this.newPurchasePrice = null;
      this.newSellingPrice = null;
      this.newInitialQuantity = 50;
    });
  }

  updateStock(): void {
    if (!this.selectedShopId || !this.selectedProductId) return;

    this.inventoryService.setStock(
      this.selectedShopId,
      this.selectedProductId,
      this.stockQuantity,
      this.alertThreshold
    ).subscribe(() => {
      this.onShopChange();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
