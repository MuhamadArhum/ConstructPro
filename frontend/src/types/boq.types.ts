export interface BoqItemDto {
  id: string;
  sectionId: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
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
