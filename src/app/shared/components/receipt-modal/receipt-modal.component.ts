import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FcfaPipe } from '../../pipes/fcfa.pipe';
import { ReceiptService } from '../../../core/services/receipt.service';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule, FcfaPipe],
  templateUrl: './receipt-modal.component.html',
  styleUrls: ['./receipt-modal.component.css']
})
export class ReceiptModalComponent {
  constructor(public receiptService: ReceiptService) {}

  print(): void {
    this.receiptService.printReceipt();
  }

  close(): void {
    this.receiptService.close();
  }
}
