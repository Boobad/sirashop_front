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

export interface CompanyRegistrationDto {
  companyName: string;
  phone: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword?: string;
  hasSalesEnabled: boolean;
  hasRepairsEnabled: boolean;
}

