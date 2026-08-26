import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface ToastOptions {
  title?: string;
  duration?: number; // Duration in ms. Default 4000ms. 0 for persistent
  action?: ToastAction;
  icon?: string;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  action?: ToastAction;
  icon?: string;
  createdAt: number;
  dismissing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastItem[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  private defaultDuration = 4000;

  /**
   * Helper to extract user-friendly error message from API HttpErrorResponse or unknown error
   */
  public extractErrorMessage(err: any, fallbackMessage: string = 'Une erreur est survenue'): string {
    if (!err) return fallbackMessage;
    if (typeof err === 'string') return this.sanitizeRawMessage(err, fallbackMessage);
    
    let rawMsg: string | null = null;
    if (err.error) {
      if (typeof err.error === 'string') rawMsg = err.error;
      else if (err.error.message) rawMsg = err.error.message;
      else if (err.error.error) rawMsg = err.error.error;
    }
    if (!rawMsg && err.message) rawMsg = err.message;
    if (!rawMsg && err.statusText && err.status !== 0) rawMsg = `${err.statusText} (${err.status})`;

    return this.sanitizeRawMessage(rawMsg || fallbackMessage, fallbackMessage);
  }

  private sanitizeRawMessage(rawMsg: string, fallback: string): string {
    if (!rawMsg) return fallback;

    // 1. Détection des doublons SQL (MySQL Duplicate entry 'val' for key '...')
    if (rawMsg.includes('Duplicate entry') || rawMsg.includes('constraint')) {
      const match = rawMsg.match(/Duplicate entry '([^']+)'/i);
      const val = match ? match[1] : '';
      if (rawMsg.toLowerCase().includes('companies') || rawMsg.toLowerCase().includes('company')) {
        return val ? `Une entreprise avec le nom ou l'identifiant '${val}' existe déjà.` : `Une entreprise avec ces informations existe déjà.`;
      }
      if (rawMsg.toLowerCase().includes('users') || rawMsg.toLowerCase().includes('email')) {
        return val ? `L'adresse ou l'identifiant '${val}' est déjà utilisé par un autre compte.` : `Ce compte existe déjà.`;
      }
      return val ? `La valeur '${val}' est déjà utilisée et doit être unique.` : `Un enregistrement avec ces informations existe déjà.`;
    }

    // 2. Détection des erreurs d'exécution SQL brutes Hibernate
    if (rawMsg.includes('could not execute statement') || rawMsg.includes('SQL [') || rawMsg.includes('JDBC exception')) {
      return `Impossible d'enregistrer : une contrainte d'unicité ou d'intégrité en base de données a été violée.`;
    }

    // 3. Si le message est un JSON encapsulé
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.message) return this.sanitizeRawMessage(parsed.message, fallback);
    } catch (_) {}

    return rawMsg;
  }

  public show(type: ToastType, message: string, options?: ToastOptions): string {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const duration = options?.duration !== undefined ? options.duration : this.defaultDuration;

    const newToast: ToastItem = {
      id,
      type,
      title: options?.title,
      message,
      duration,
      action: options?.action,
      icon: options?.icon || this.getDefaultIcon(type),
      createdAt: Date.now(),
      dismissing: false
    };

    this.toastsSignal.update(current => [newToast, ...current]);

    if (duration > 0) {
      setTimeout(() => {
        if (this.toastsSignal().some(t => t.id === id)) {
          this.dismiss(id);
        }
      }, duration);
    }

    return id;
  }

  public success(message: string, options?: ToastOptions): string {
    return this.show('success', message, {
      title: options?.title || 'Succès',
      ...options
    });
  }

  public error(errorOrMessage: any, options?: ToastOptions): string {
    const msg = typeof errorOrMessage === 'string'
      ? errorOrMessage
      : this.extractErrorMessage(errorOrMessage, options?.title || 'Erreur');
    return this.show('error', msg, {
      title: options?.title || 'Erreur',
      duration: options?.duration !== undefined ? options.duration : 5000,
      ...options
    });
  }

  public warning(message: string, options?: ToastOptions): string {
    return this.show('warning', message, {
      title: options?.title || 'Attention',
      ...options
    });
  }

  public info(message: string, options?: ToastOptions): string {
    return this.show('info', message, {
      title: options?.title || 'Information',
      ...options
    });
  }

  public dismiss(id: string): void {
    // Mark as dismissing to trigger fade-out animation
    this.toastsSignal.update(current =>
      current.map(t => (t.id === id ? { ...t, dismissing: true } : t))
    );

    setTimeout(() => {
      this.toastsSignal.update(current => current.filter(t => t.id !== id));
    }, 280);
  }

  public clear(): void {
    this.toastsSignal.set([]);
  }

  private getDefaultIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  }
}
