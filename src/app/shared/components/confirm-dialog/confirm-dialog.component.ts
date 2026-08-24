import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  constructor(public confirmService: ConfirmDialogService) {}

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmService.state().isOpen) {
      this.confirmService.handleCancel();
    }
  }

  onConfirm(): void {
    this.confirmService.handleConfirm();
  }

  onCancel(): void {
    this.confirmService.handleCancel();
  }
}
