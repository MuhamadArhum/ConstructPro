export interface BoqItemDto {
  id: string;
  sectionId: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  billedQuantity: number;
  remainingQuantity: number;
  billedAmount: number;
  remainingAmount: number;
  notes?: string | null;
  order: number;
}

export interface BoqSectionDto {
  id: string;
  boqId: string;
  title: string;
  order: number;
  items: BoqItemDto[];
  subtotal: number;
  billedSubtotal: number;
}

export interface BoqDto {
  id: string;
  projectId: string;
  title: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  sections: BoqSectionDto[];
  grandTotal: number;
  totalBilled: number;
  remainingAmount: number;
}

export interface CreateBoqRequest {
  title?: string;
  notes?: string;
}

export interface UpdateBoqRequest {
  title?: string;
  notes?: string;
}

export interface CreateBoqSectionRequest {
  title: string;
}

export interface UpdateBoqSectionRequest {
  title?: string;
}

export interface CreateBoqItemRequest {
  description: string;
  unit?: string;
  quantity?: number;
  unitRate?: number;
  notes?: string;
}

export interface UpdateBoqItemRequest {
  description?: string;
  unit?: string;
  quantity?: number;
  unitRate?: number;
  notes?: string;
}

export interface ProgressBillItemRequest {
  boqItemId: string;
  billedQty: number;
}

export interface CreateProgressBillRequest {
  customerId: string;
  issueDate: string;
  dueDate: string;
  taxRate?: number;
  notes?: string;
  items: ProgressBillItemRequest[];
}

export interface ProgressBillItemDto {
  id: string;
  boqItemId: string;
  description: string;
  unit: string;
  billedQty: number;
  unitRate: number;
  amount: number;
}

export interface ProgressBillDto {
  id: string;
  billNumber: number;
  notes?: string | null;
  createdAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    issueDate: string;
    dueDate: string;
    customer: { id: string; name: string };
  };
  items: ProgressBillItemDto[];
}

export interface CreateProgressBillResponse {
  progressBillId: string;
  billNumber: number;
  invoiceId: string;
  invoiceNumber: string;
  total: number;
}
