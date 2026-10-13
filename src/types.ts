export interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary?: string;
  location: string;
  url: string;
  source: string;
  datePublished?: string;
  description?: string;
}

export interface SearchQuery {
  keyword: string;
  city: string;
  cityId?: number;
}

export interface SearchSource {
  name: string;
  id: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  count: number;
}
