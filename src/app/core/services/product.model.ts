export interface Product {
  id?: number;
  name: string;
  description?: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  companyId: number;
  createdAt?: string;
}
