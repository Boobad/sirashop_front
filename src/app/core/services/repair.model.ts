export type RepairStatus = 'RECEIVED' | 'DIAGNOSING' | 'IN_PROGRESS' | 'REPAIRED' | 'DELIVERED' | 'CANCELLED';

export interface RepairTicket {
  id?: number;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  issueDescription: string;
  estimatedPrice?: number;
  depositAmount?: number;
  status?: RepairStatus;
  companyId: number;
  shopId: number;
  shopName?: string;
  technicianId?: number;
  technicianUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}
