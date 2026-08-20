import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez saisir votre identifiant et mot de passe';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.loading = false;
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
        this.errorMessage = err.error?.message || 'Identifiant ou mot de passe incorrect';
      }
    });
  }
}
