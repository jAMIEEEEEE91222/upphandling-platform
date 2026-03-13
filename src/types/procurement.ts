import { z } from "zod";

export const CreateProcurementSchema = z.object({
  title: z.string().min(1, "Titel krävs").max(200, "Max 200 tecken"),
  category: z.string().min(1, "Kategori krävs").max(100, "Max 100 tecken"),
  referenceNumber: z.string().optional(),
});

export type CreateProcurementInput = z.infer<typeof CreateProcurementSchema>;

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
