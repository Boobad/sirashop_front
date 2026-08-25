import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  // Modale obligatoire de changement de mot de passe à la 1ère connexion
  showMandatoryPasswordModal: boolean = false;
  loggedInUser: LoginResponse | null = null;
  mandatoryOldPassword: string = '';
  mandatoryNewPassword: string = '';
  mandatoryConfirmPassword: string = '';
  mandatoryPasswordError: string = '';
  submittingMandatoryPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si l'utilisateur est déjà connecté avec un changement de mot de passe obligatoire requis
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getUser();
      if (user && user.mustChangePassword) {
        this.loggedInUser = user;
        this.showMandatoryPasswordModal = true;
        this.mandatoryOldPassword = '';
      }
    }
  }

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

        // Si le backend exige un changement de mot de passe à la 1ère connexion
        if (res.mustChangePassword === true) {
          this.loggedInUser = res;
          this.mandatoryOldPassword = this.password; // Pré-rempli avec le mot de passe saisi pour la connexion
          this.mandatoryNewPassword = '';
          this.mandatoryConfirmPassword = '';
          this.mandatoryPasswordError = '';
          this.showMandatoryPasswordModal = true;
          this.toastService.info('Première connexion : Pour sécuriser votre compte, veuillez définir votre nouveau mot de passe.', {
            title: '🔒 Sécurisation Requise',
            duration: 7000
          });
          return;
        }

        // Connexion normale
        this.toastService.success(`Connexion réussie ! Bienvenue, ${this.authService.getUserDisplayName(res)}.`, {
          title: '✨ Authentification réussie',
          duration: 3000
        });

        this.navigateToRole(res.role);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Identifiant ou mot de passe incorrect';
        this.errorMessage = msg;
        this.toastService.error(err, { title: 'Échec de connexion' });
      }
    });
  }

  submitMandatoryPasswordChange(): void {
    if (!this.loggedInUser || !this.loggedInUser.id) {
      this.mandatoryPasswordError = 'Session expirée. Veuillez vous reconnecter.';
      return;
    }

    const oldPwd = this.mandatoryOldPassword.trim();
    const newPwd = this.mandatoryNewPassword.trim();
    const confirmPwd = this.mandatoryConfirmPassword.trim();

    if (!oldPwd) {
      this.mandatoryPasswordError = 'Veuillez saisir votre mot de passe temporaire actuel.';
      return;
    }
    if (!newPwd || newPwd.length < 6) {
      this.mandatoryPasswordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (newPwd !== confirmPwd) {
      this.mandatoryPasswordError = 'La confirmation ne correspond pas au nouveau mot de passe.';
      return;
    }
    if (newPwd === oldPwd) {
      this.mandatoryPasswordError = 'Le nouveau mot de passe doit être différent du mot de passe temporaire.';
      return;
    }

    this.submittingMandatoryPassword = true;
    this.mandatoryPasswordError = '';

    this.userService.changePassword(this.loggedInUser.id, oldPwd, newPwd).subscribe({
      next: () => {
        this.submittingMandatoryPassword = false;
        // Mise à jour de l'état local pour lever le blocage
        this.authService.updateLocalUser({ mustChangePassword: false });
        this.showMandatoryPasswordModal = false;
        
        this.toastService.success('Mot de passe mis à jour avec succès ! Bienvenue sur SiraShop.', {
          title: '🎉 Compte Sécurisé & Activé',
          duration: 4000
        });

        const targetRole = this.loggedInUser!.role;
        this.navigateToRole(targetRole);
      },
      error: (err) => {
        this.submittingMandatoryPassword = false;
        const msg = err.error?.message || (typeof err === 'string' ? err : 'Erreur lors du changement de mot de passe.');
        this.mandatoryPasswordError = msg;
        this.toastService.error(msg, { title: 'Erreur mot de passe' });
      }
    });
  }

  cancelMandatoryModal(): void {
    this.authService.logout();
    this.showMandatoryPasswordModal = false;
    this.loggedInUser = null;
    this.password = '';
    this.toastService.info('Session annulée. Vous pouvez vous reconnecter plus tard.');
  }

  private navigateToRole(role: string): void {
    switch (role) {
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
      case 'REPAIRER':
        this.router.navigate(['/repair']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}

