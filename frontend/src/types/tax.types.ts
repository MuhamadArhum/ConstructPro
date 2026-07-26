export type TaxType = 'SalesTax' | 'IncomeTax' | 'PRA' | 'WithholdingTax' | 'SecurityDeposit';

export interface TaxRecordDto {
  id: string;
  taxType: TaxType;
  taxTypeDisplay: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueDate?: string;
  paidDate?: string;
  isPaid: boolean;
  reference?: string;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface TaxSummaryDto {
  totalTax: number;
  totalPaid: number;
  totalPending: number;
  overdueCount: number;
}

export interface CreateTaxRecordRequest {
  taxType: TaxType;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueDate?: string;
  paidDate?: string;
  isPaid: boolean;
  reference?: string;
  description?: string;
  notes?: string;
}

export interface UpdateTaxRecordRequest extends CreateTaxRecordRequest {}

export interface TaxQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  taxType?: string;
  isPaid?: boolean;
  fromDate?: string;
  toDate?: string;
}
