export interface Inventory {
  id?: number;
  productId: number;
  productName?: string;
  shopId: number;
  shopName?: string;
  shopAddress?: string;
  quantity: number;
  alertThreshold?: number;
}
