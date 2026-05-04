export interface Client {
  _id: string;
  code?: string;
  name: string;
  taxRegistrationNumber?: string | null;
  googleMapsLink?: string | null;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
