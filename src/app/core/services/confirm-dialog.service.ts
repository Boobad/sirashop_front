import { Injectable, signal } from '@angular/core';

export type DialogType = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: string;
}

export interface DialogState extends ConfirmOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogStateSignal = signal<DialogState>({
    isOpen: false,
    message: ''
  });

  public readonly state = this.dialogStateSignal.asReadonly();

  public confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.dialogStateSignal.set({
        isOpen: true,
        title: options.title || 'Confirmation requise',
        message: options.message,
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        type: options.type || 'warning',
        icon: options.icon || this.getDefaultIcon(options.type || 'warning'),
        resolve
      });
    });
  }

  public handleConfirm(): void {
    const current = this.dialogStateSignal();
    if (current.resolve) {
      current.resolve(true);
    }
    this.close();
  }

  public handleCancel(): void {
    const current = this.dialogStateSignal();
    if (current.resolve) {
      current.resolve(false);
    }
    this.close();
  }

  private close(): void {
    this.dialogStateSignal.set({
      isOpen: false,
      message: ''
    });
  }

  private getDefaultIcon(type: DialogType): string {
    switch (type) {
      case 'danger':
        return '🛑';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'primary':
        return '❓';
    }
  }
}
