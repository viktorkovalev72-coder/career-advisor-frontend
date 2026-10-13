export interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary?: string;
  salaryFrom?: number;
  salaryTo?: number;
  location: string;
  url: string;
  source: string;
  datePublished?: string;
  description?: string;
  employment?: string;
  experience?: string;
  isFavorite?: boolean;
}

export interface SearchFilters {
  keywords: string[];
  city: string;
  cityId?: number;
  regionCode?: string;
  salaryFrom?: number;
  salaryTo?: number;
  dateFrom?: string;
  employment?: string[];
  experience?: string[];
}

export interface City {
  name: string;
  hhId: number;
  trudCode: string;
}

export interface MarketAnalytics {
  totalVacancies: number;
  averageSalary: number;
  bySource: Record<string, number>;
  byEmployment: Record<string, number>;
  salaryDistribution: {
    range: string;
    count: number;
  }[];
}
