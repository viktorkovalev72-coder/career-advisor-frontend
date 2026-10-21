// Типы данных для статистики
export interface SearchStats {
  id: string;
  timestamp: string;
  keywords: string[];
  city: string;
  cityId: number;
  salaryFrom?: number;
  salaryTo?: number;
  employment: string[];
  experience: string[];
  resultsCount: number;
  exportedTo?: 'pdf' | 'excel' | 'email';
  userId?: string;
}

export interface AppStatistics {
  totalSearches: number;
  totalExports: number;
  searches: SearchStats[];
  keywordRating: Record<string, number>;
  cityRating: Record<string, number>;
  employmentRating: Record<string, number>;
  experienceRating: Record<string, number>;
  dailyStats: Record<string, number>;
  uniqueUsers: string[];
  topKeywords: Array<{ keyword: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
}

// URL сервера для статистики
const API_URL = 'https://career-advisor-prsj.onrender.com';
const ADMIN_PASSWORD = 'admin2024'; // Измените на свой пароль!

// Получить статистику с сервера (только для админа)
export async function getStatistics(): Promise<AppStatistics | null> {
  try {
    const response = await fetch(`${API_URL}/api/stats`, {
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
    });
    
    if (!response.ok) {
      console.error('Error fetching statistics:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return null;
  }
}

// Добавить новый поиск в статистику на сервере
export async function addSearchToStats(search: Omit<SearchStats, 'id' | 'timestamp' | 'userId'>): Promise<void> {
  try {
    await fetch(`${API_URL}/api/stats/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(search),
    });
  } catch (error) {
    console.error('Error adding search to stats:', error);
  }
}

// Добавить экспорт в статистику на сервере
export async function addExportToStats(type: 'pdf' | 'excel' | 'email'): Promise<void> {
  try {
    await fetch(`${API_URL}/api/stats/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });
  } catch (error) {
    console.error('Error adding export to stats:', error);
  }
}

// Проверка пароля администратора
export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

// Очистить всю статистику на сервере (только для админа)
export async function clearStatistics(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/stats`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing statistics:', error);
    return false;
  }
}

// Экспорт статистики в JSON с сервера (только для админа)
export async function exportStatisticsToJSON(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/stats/export/json`, {
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error exporting statistics to JSON:', error);
    return null;
  }
}

// Экспорт статистики в CSV с сервера (только для админа)
export async function exportStatisticsToCSV(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/stats/export/csv`, {
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error exporting statistics to CSV:', error);
    return null;
  }
}
