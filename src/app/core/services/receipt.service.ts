import { Injectable, signal } from '@angular/core';

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  ticketType?: 'SALE' | 'REPAIR';
  saleId?: number | string;
  ticketNumber?: string | number;
  date?: string | Date;
  companyName?: string;
  shopName?: string;
  shopAddress?: string;
  sellerName?: string;
  customerName?: string;
  customerPhone?: string;
  deviceModel?: string;
  issueDescription?: string;
  technicianName?: string;
  statusLabel?: string;
  items?: ReceiptItem[];
  totalAmount: number;
  depositAmount?: number;
  remainingAmount?: number;
  paymentMethod?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private isOpenSignal = signal<boolean>(false);
  private receiptDataSignal = signal<ReceiptData | null>(null);

  public readonly isOpen = this.isOpenSignal.asReadonly();
  public readonly receiptData = this.receiptDataSignal.asReadonly();

  public openReceipt(data: ReceiptData): void {
    this.receiptDataSignal.set({
      ...data,
      date: data.date || new Date()
    });
    this.isOpenSignal.set(true);
  }

  public close(): void {
    this.isOpenSignal.set(false);
    this.receiptDataSignal.set(null);
  }

  public printReceipt(): void {
    window.print();
  }
}
