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
  collectionDate?: Date;
  collectedAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
