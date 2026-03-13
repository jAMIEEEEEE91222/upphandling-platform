export type ProcurementStatus = "DRAFT" | "IMPORTED" | "ANALYZED" | "REPORTED";

export interface Procurement {
  id: string;
  title: string;
  category: string;
  referenceNumber: string | null;
  status: ProcurementStatus;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export interface ProcurementWithCounts extends Procurement {
  _count: {
    bids: number;
  };
}

export interface Bid {
  id: string;
  procurementId: string;
  supplierName: string;
  importedAt: string;
}

export interface LineItem {
  id: string;
  bidId: string;
  itemName: string;
  itemCode: string | null;
  unit: string | null;
  price: string | null; // Decimal serialiseras som string
  priceNote: string | null;
}
