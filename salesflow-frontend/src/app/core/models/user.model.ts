export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  avatarUrl?: string | null;
  avatarOriginalUrl?: string | null;
  avatarCrop?: { panX: number, panY: number, zoom: number };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
