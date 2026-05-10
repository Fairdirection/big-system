export interface Seller {
  employeeId: string;
  employeeName?: string;
  sharePercentage: number;
  commissionValue?: number;
  isManualOverride: boolean;
}

export type SaleStatus = 'draft' | 'confirmed' | 'claimed' | 'collected';

export interface Sale {
  _id: string;
  saleNumber?: string;
  source: string;
  isPrivateSource: boolean;
  bookingDate?: Date;
  contractDate: Date;
  clientRegistrationDate?: Date;
  unitLocation?: string;
  projectName: string;
  clientId: string;
  clientName?: string;
  unitNumber: string;
  unitType: string;
  unitValue: number;
  developerCollectionPercentage: number;
  contractCommissionPercentage: number;
  incentivePercentage: number;
  collectedCommissionPercentage?: number;
  grossCommissionWithVAT?: number;
  netRevenue?: number;
  vat?: number;
  withholdingTax?: number;
  invoiceAmount?: number;
  invoiceStatus: string;
  vatPercentage?: number;
  withholdingTaxPercentage?: number;
  expectedCollectionDate?: Date;
  sellers: Seller[];
  quarterId?: string;
  status: SaleStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
