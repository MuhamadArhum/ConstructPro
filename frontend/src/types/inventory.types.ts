export type StockTransactionType = 'In' | 'Out' | 'Adjustment';

export interface InventoryItemDto {
  id: string;
  code?: string;
  name: string;
  category?: string;
  unit?: string;
  currentStock: number;
  lowStockThreshold: number;
  unitPrice?: number;
  supplierName?: string;
  location?: string;
  isLowStock: boolean;
  notes?: string;
  createdAt: string;
}

export interface CreateInventoryItemRequest {
  name: string;
  category?: string;
  unit?: string;
  currentStock: number;
  lowStockThreshold: number;
  unitPrice?: number;
  supplierName?: string;
  location?: string;
  notes?: string;
}

export interface UpdateInventoryItemRequest extends CreateInventoryItemRequest {}

export interface InventoryQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export interface StockTransactionDto {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: StockTransactionType;
  typeDisplay: string;
  quantity: number;
  unitPrice?: number;
  date: string;
  reference?: string;
  projectName?: string;
  notes?: string;
  createdAt: string;
}

export interface AddStockTransactionRequest {
  type: StockTransactionType;
  quantity: number;
  unitPrice?: number;
  date: string;
  reference?: string;
  projectName?: string;
  notes?: string;
}
