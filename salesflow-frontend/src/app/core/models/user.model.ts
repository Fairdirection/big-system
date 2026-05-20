export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
