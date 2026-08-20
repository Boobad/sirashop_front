export interface ShopStats {
  shopId: number;
  shopName: string;
  salesRevenue: number;
  salesCount: number;
  repairRevenue: number;
  repairsCount: number;
  totalRevenue: number;
}

export interface Stats {
  totalRevenue: number;
  salesRevenue: number;
  repairRevenue: number;
  totalSalesCount: number;
  totalRepairsCount: number;
  shopStats: ShopStats[];
}
