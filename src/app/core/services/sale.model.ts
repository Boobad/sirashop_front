export interface SaleItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface Sale {
  id?: number;
  companyId: number;
  shopId: number;
  shopName?: string;
  sellerId: number;
  sellerUsername?: string;
  totalAmount?: number;
  paymentMethod?: string;
  items: SaleItem[];
  createdAt?: string;
}
