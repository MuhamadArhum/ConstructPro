export interface POItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  projectId?: string | null;
  issueDate: string;
  expectedDelivery?: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  supplier?: { id: string; name: string; companyName?: string | null; phone?: string | null };
  project?: { id: string; name: string } | null;
  items?: POItem[];
}

export interface CreatePOItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  projectId?: string;
  issueDate: string;
  expectedDelivery?: string;
  status?: string;
  taxAmount?: number;
  notes?: string;
  items: CreatePOItemDto[];
}
