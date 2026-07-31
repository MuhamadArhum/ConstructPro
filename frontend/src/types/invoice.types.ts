export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  projectId?: string | null;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  customer?: { id: string; name: string; companyName?: string | null; phone?: string | null };
  project?: { id: string; name: string } | null;
  items?: InvoiceItem[];
}

export interface CreateInvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceDto {
  customerId: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  status?: string;
  taxAmount?: number;
  notes?: string;
  items: CreateInvoiceItemDto[];
}
