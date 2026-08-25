export type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'MANAGER' | 'SELLER' | 'TECHNICIAN' | 'REPAIRER';

export interface User {
  id?: number;
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  companyId?: number;
  shopId?: number;
  shopName?: string;
  isActive?: boolean;
  active?: boolean;
}

