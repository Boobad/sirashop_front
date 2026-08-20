export type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'MANAGER' | 'SELLER' | 'TECHNICIAN';

export interface User {
  id?: number;
  username: string;
  password?: string;
  role: UserRole;
  companyId?: number;
  shopId?: number;
  active?: boolean;
}
