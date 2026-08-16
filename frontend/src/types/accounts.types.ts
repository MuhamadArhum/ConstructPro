export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccountDto {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  accountTypeDisplay: string;
  parentId?: string;
  parentName?: string;
  isActive: boolean;
  description?: string;
  balance: number;
  level: number;
  createdAt: string;
}

export interface CreateChartOfAccountRequest {
  code: string;
  name: string;
  accountType: AccountType;
  parentId?: string;
  isActive: boolean;
  description?: string;
}

export interface UpdateChartOfAccountRequest extends CreateChartOfAccountRequest {}

export interface AccountQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  accountType?: string;
  isActive?: boolean;
  level?: number;
  level4Only?: boolean;
}

export interface LedgerEntryDto {
  id: string;
  date: string;
  entryNumber: string;
  description?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountLedgerDto {
  account: ChartOfAccountDto;
  entries: LedgerEntryDto[];
  closingBalance: number;
}

export interface LedgerQuery {
  startDate?: string;
  endDate?: string;
}

export interface JournalEntryLineDto {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntryDto {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  notes?: string;
  createdAt: string;
  lines: JournalEntryLineDto[];
}

export interface CreateJournalEntryLineRequest {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalEntryRequest {
  date: string;
  description: string;
  reference?: string;
  notes?: string;
  lines: CreateJournalEntryLineRequest[];
}

export interface JournalEntryQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  isPosted?: boolean;
}
