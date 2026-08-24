import { ShopStats } from './stats.model';

export interface DailyRevenue {
  date: string;
  salesRevenue: number;
  repairRevenue: number;
  totalRevenue: number;
  salesCount: number;
  repairsCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface SellerPerformance {
  sellerId: number;
  sellerName: string;
  totalSalesCount: number;
  totalRevenue: number;
}

export interface PaymentMethodStat {
  paymentMethod: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface AdvancedStats {
  dailyRevenue: DailyRevenue[];
  topProducts: TopProduct[];
  sellerPerformance: SellerPerformance[];
  paymentMethods: PaymentMethodStat[];
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowthPercentage: number;
  shopStats: ShopStats[];
  totalRevenue: number;
  salesRevenue: number;
  repairRevenue: number;
  totalSalesCount: number;
  totalRepairsCount: number;
}
