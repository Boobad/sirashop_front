export interface Company {
  id?: number;
  name: string;
  ownerName?: string;
  phone?: string;
  hasSalesEnabled?: boolean;
  hasRepairsEnabled?: boolean;
  active?: boolean;
  createdAt?: string;
}

