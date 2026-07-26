export interface CompanySettingsDto {
  id: string;
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  ntn?: string;
  strn?: string;
  logoPath?: string;
  currency?: string;
  financialYearStart?: string;
  updatedAt: string;
}

export interface UpdateCompanySettingsRequest {
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  ntn?: string;
  strn?: string;
  currency?: string;
  financialYearStart?: string;
}
