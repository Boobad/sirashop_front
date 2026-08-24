import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css']
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}

  onActionClick(toast: ToastItem): void {
    if (toast.action) {
      toast.action.onClick();
      this.toastService.dismiss(toast.id);
    }
  }

  onDismiss(toast: ToastItem): void {
    this.toastService.dismiss(toast.id);
  }
}
