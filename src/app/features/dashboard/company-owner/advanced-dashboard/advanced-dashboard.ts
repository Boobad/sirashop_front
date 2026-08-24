import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { CompanyService } from '../../../../core/services/company.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { Company } from '../../../../core/services/company.model';
import { AdvancedStats } from '../../../../core/services/advanced-stats.model';

Chart.register(...registerables);

@Component({
  selector: 'app-advanced-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './advanced-dashboard.html',
  styleUrls: ['./advanced-dashboard.css']
})
export class AdvancedDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  companies: Company[] = [];
  selectedCompanyId: number | null = null;
  currentUser: any = null;
  stats: AdvancedStats | null = null;
  loading: boolean = true;
  error: string | null = null;

  // Password Modal State
  showPasswordModal: boolean = false;
  oldPasswordInput: string = '';
  newPasswordInput: string = '';
  passwordSuccess: string = '';
  passwordError: string = '';

  // Canvas references
  @ViewChild('dailyRevenueChartCanvas') dailyRevenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsChartCanvas') topProductsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sellerPerformanceChartCanvas') sellerPerformanceCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentMethodsChartCanvas') paymentMethodsCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  private dailyChartInstance: Chart | null = null;
  private topProductsChartInstance: Chart | null = null;
  private sellerChartInstance: Chart | null = null;
  private paymentChartInstance: Chart | null = null;

  constructor(
    private companyService: CompanyService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
          this.loadAdvancedStats();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erreur chargement entreprises', err);
        // Direct attempt with user's companyId
        if (this.currentUser && this.currentUser.companyId) {
          this.selectedCompanyId = this.currentUser.companyId;
          this.loadAdvancedStats();
        } else {
          this.loading = false;
          this.error = 'Impossible de charger la liste des entreprises.';
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // If stats already loaded before view init
    if (this.stats) {
      setTimeout(() => this.renderCharts(), 0);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.loadAdvancedStats();
    }
  }

  loadAdvancedStats(): void {
    if (!this.selectedCompanyId) return;
    this.loading = true;
    this.error = null;

    this.dashboardService.getAdvancedStats(this.selectedCompanyId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 50);
      },
      error: (err) => {
        console.error('Erreur chargement des stats avancées', err);
        this.loading = false;
        this.error = 'Erreur lors du chargement des statistiques avancées.';
      }
    });
  }

  private destroyCharts(): void {
    if (this.dailyChartInstance) {
      this.dailyChartInstance.destroy();
      this.dailyChartInstance = null;
    }
    if (this.topProductsChartInstance) {
      this.topProductsChartInstance.destroy();
      this.topProductsChartInstance = null;
    }
    if (this.sellerChartInstance) {
      this.sellerChartInstance.destroy();
      this.sellerChartInstance = null;
    }
    if (this.paymentChartInstance) {
      this.paymentChartInstance.destroy();
      this.paymentChartInstance = null;
    }
  }

  private renderCharts(): void {
    if (!this.stats) return;
    this.destroyCharts();

    // 1. Daily Revenue Chart (Line Chart)
    if (this.dailyRevenueCanvas && this.stats.dailyRevenue) {
      const dates = this.stats.dailyRevenue.map(d => d.date);
      const totalRev = this.stats.dailyRevenue.map(d => d.totalRevenue);
      const salesRev = this.stats.dailyRevenue.map(d => d.salesRevenue);
      const repairRev = this.stats.dailyRevenue.map(d => d.repairRevenue);

      const ctx = this.dailyRevenueCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dailyChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: 'CA Total (FCFA)',
                data: totalRev,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
              },
              {
                label: 'Ventes Articles (FCFA)',
                data: salesRev,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderWidth: 2,
                borderDash: [4, 4],
                fill: false,
                tension: 0.4
              },
              {
                label: 'Réparations SAV (FCFA)',
                data: repairRev,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                borderWidth: 2,
                borderDash: [4, 4],
                fill: false,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: '#94a3b8', font: { family: 'Inter', weight: 600 } }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} FCFA`
                }
              }
            },
            scales: {
              x: {
                ticks: { color: '#64748b', maxRotation: 45 },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
              },
              y: {
                ticks: {
                  color: '#64748b',
                  callback: (val) => `${Number(val).toLocaleString()} F`
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
              }
            }
          }
        });
      }
    }

    // 2. Top 5 Products Chart (Horizontal Bar Chart)
    if (this.topProductsCanvas && this.stats.topProducts) {
      const labels = this.stats.topProducts.map(p => p.productName);
      const quantities = this.stats.topProducts.map(p => p.totalQuantitySold);

      const ctx = this.topProductsCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.topProductsChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Quantité vendue',
              data: quantities,
              backgroundColor: [
                'rgba(59, 130, 246, 0.85)',
                'rgba(16, 185, 129, 0.85)',
                'rgba(245, 158, 11, 0.85)',
                'rgba(139, 92, 246, 0.85)',
                'rgba(236, 72, 153, 0.85)'
              ],
              borderColor: [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#8b5cf6',
                '#ec4899'
              ],
              borderWidth: 1,
              borderRadius: 8
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `Vendus : ${ctx.raw} unité(s)`
                }
              }
            },
            scales: {
              x: {
                ticks: { color: '#64748b', stepSize: 1 },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
              },
              y: {
                ticks: { color: '#94a3b8', font: { family: 'Inter', weight: 600 } },
                grid: { display: false }
              }
            }
          }
        });
      }
    }

    // 3. Seller Performance Chart (Vertical Bar Chart)
    if (this.sellerPerformanceCanvas && this.stats.sellerPerformance) {
      const sellers = this.stats.sellerPerformance.map(s => s.sellerName);
      const revenues = this.stats.sellerPerformance.map(s => s.totalRevenue);

      const ctx = this.sellerPerformanceCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.sellerChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: sellers,
            datasets: [{
              label: 'Chiffre d\'affaires généré (FCFA)',
              data: revenues,
              backgroundColor: 'rgba(16, 185, 129, 0.75)',
              borderColor: '#10b981',
              borderWidth: 2,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `CA : ${Number(ctx.raw).toLocaleString()} FCFA`
                }
              }
            },
            scales: {
              x: {
                ticks: { color: '#94a3b8', font: { family: 'Inter', weight: 600 } },
                grid: { display: false }
              },
              y: {
                ticks: {
                  color: '#64748b',
                  callback: (val) => `${Number(val).toLocaleString()} F`
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
              }
            }
          }
        });
      }
    }

    // 4. Payment Methods Chart (Doughnut Chart)
    if (this.paymentMethodsCanvas && this.stats.paymentMethods) {
      const paymentLabels: { [key: string]: string } = {
        'CASH': '💵 Espèces (Cash)',
        'ORANGE_MONEY': '🍊 Orange Money',
        'MOOV_MONEY': '📱 Moov Money',
        'CARD': '💳 Carte Bancaire'
      };

      const labels = this.stats.paymentMethods.map(p => paymentLabels[p.paymentMethod] || p.paymentMethod);
      const amounts = this.stats.paymentMethods.map(p => p.totalAmount);

      const colorMap: { [key: string]: string } = {
        'CASH': '#10b981',
        'ORANGE_MONEY': '#f97316',
        'MOOV_MONEY': '#06b6d4',
        'CARD': '#3b82f6'
      };

      const bgColors = this.stats.paymentMethods.map(p => colorMap[p.paymentMethod] || '#8b5cf6');

      const ctx = this.paymentMethodsCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.paymentChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: amounts,
              backgroundColor: bgColors,
              borderColor: '#0f172a',
              borderWidth: 3,
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', font: { family: 'Inter', weight: 600 }, padding: 15 }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${Number(ctx.raw).toLocaleString()} FCFA`
                }
              }
            },
            cutout: '65%'
          }
        });
      }
    }
  }

  // Password Modal Handlers
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
