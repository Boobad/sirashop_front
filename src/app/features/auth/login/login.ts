import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez saisir votre identifiant et mot de passe';
      this.toastService.warning(this.errorMessage);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success(`Connexion réussie ! Bienvenue, ${res.username}.`, {
          title: '✨ Authentification réussie',
          duration: 3000
        });

        // Redirection automatique selon le Rôle de l'utilisateur
        switch (res.role) {
          case 'SUPER_ADMIN':
            this.router.navigate(['/super-admin']);
            break;
          case 'COMPANY_OWNER':
            this.router.navigate(['/company-owner']);
            break;
          case 'SELLER':
          case 'MANAGER':
            this.router.navigate(['/pos']);
            break;
          case 'TECHNICIAN':
            this.router.navigate(['/repair']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Identifiant ou mot de passe incorrect';
        this.errorMessage = msg;
        this.toastService.error(err, { title: 'Échec de connexion' });
      }
    });
  }
}

