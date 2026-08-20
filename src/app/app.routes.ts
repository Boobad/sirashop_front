import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { SuperAdminComponent } from './features/dashboard/super-admin/super-admin';
import { CompanyOwnerComponent } from './features/dashboard/company-owner/company-owner';
import { StockManagerComponent } from './features/inventory/stock-manager/stock-manager';
import { CheckoutComponent } from './features/pos/checkout/checkout';
import { RepairManagerComponent } from './features/repair/repair-manager/repair-manager';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  { 
    path: 'super-admin', 
    component: SuperAdminComponent,
    canActivate: [authGuard],
    data: { roles: ['SUPER_ADMIN'] }
  },
  { 
    path: 'company-owner', 
    component: CompanyOwnerComponent,
    canActivate: [authGuard],
    data: { roles: ['SUPER_ADMIN', 'COMPANY_OWNER'] }
  },
  { 
    path: 'stock', 
    component: StockManagerComponent,
    canActivate: [authGuard],
    data: { roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER'] }
  },
  { 
    path: 'pos', 
    component: CheckoutComponent,
    canActivate: [authGuard],
    data: { roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'SELLER'] }
  },
  { 
    path: 'repair', 
    component: RepairManagerComponent,
    canActivate: [authGuard],
    data: { roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'TECHNICIAN'] }
  },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
