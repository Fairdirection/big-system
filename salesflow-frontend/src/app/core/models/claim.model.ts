export interface Claim {
  _id: string;
  claimNumber: string;
  saleId: string;
  saleNumber: string;
  projectName: string;
  unitNumber: string;
  clientName: string;
  commissionDue: number;
  status: 'pending' | 'submitted' | 'collected' | 'disputed';
  invoiceNumber?: string;
  invoiceStatus?: string;
  expectedCollectionDate?: string | Date;
  collectionDate?: Date;
  collectedAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
