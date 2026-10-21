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
}

const STORAGE_KEY = 'career-advisor-statistics';
const ADMIN_PASSWORD = 'admin2024'; // Измените на свой пароль!

// Получить статистику из localStorage
export function getStatistics(): AppStatistics {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      totalSearches: 0,
      totalExports: 0,
      searches: [],
      keywordRating: {},
      cityRating: {},
      employmentRating: {},
      experienceRating: {},
      dailyStats: {},
    };
  }
  return JSON.parse(data);
}

// Сохранить статистику в localStorage
export function saveStatistics(stats: AppStatistics): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

// Добавить новый поиск в статистику
export function addSearchToStats(search: Omit<SearchStats, 'id' | 'timestamp'>): void {
  const stats = getStatistics();
  
  const newSearch: SearchStats = {
    ...search,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  
  stats.searches.push(newSearch);
  stats.totalSearches++;
  
  // Обновить рейтинг ключевых слов
  search.keywords.forEach(keyword => {
    stats.keywordRating[keyword] = (stats.keywordRating[keyword] || 0) + 1;
  });
  
  // Обновить рейтинг городов
  stats.cityRating[search.city] = (stats.cityRating[search.city] || 0) + 1;
  
  // Обновить рейтинг типа занятости
  search.employment.forEach(emp => {
    stats.employmentRating[emp] = (stats.employmentRating[emp] || 0) + 1;
  });
  
  // Обновить рейтинг опыта
  search.experience.forEach(exp => {
    stats.experienceRating[exp] = (stats.experienceRating[exp] || 0) + 1;
  });
  
  // Обновить дневную статистику
  const today = new Date().toISOString().split('T')[0];
  stats.dailyStats[today] = (stats.dailyStats[today] || 0) + 1;
  
  saveStatistics(stats);
}

// Добавить экспорт в статистику
export function addExportToStats(type: 'pdf' | 'excel' | 'email'): void {
  const stats = getStatistics();
  stats.totalExports++;
  
  // Обновить последний поиск
  if (stats.searches.length > 0) {
    const lastSearch = stats.searches[stats.searches.length - 1];
    lastSearch.exportedTo = type;
  }
  
  saveStatistics(stats);
}

// Проверка пароля администратора
export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

// Очистить всю статистику
export function clearStatistics(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Получить топ N ключевых слов
export function getTopKeywords(n: number = 10): Array<{ keyword: string; count: number }> {
  const stats = getStatistics();
  return Object.entries(stats.keywordRating)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// Получить топ N городов
export function getTopCities(n: number = 10): Array<{ city: string; count: number }> {
  const stats = getStatistics();
  return Object.entries(stats.cityRating)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// Экспорт статистики в JSON
export function exportStatisticsToJSON(): string {
  const stats = getStatistics();
  return JSON.stringify(stats, null, 2);
}

// Экспорт статистики в CSV
export function exportStatisticsToCSV(): string {
  const stats = getStatistics();
  
  let csv = 'Дата,Ключевые слова,Город,Результатов,Экспорт\n';
  
  stats.searches.forEach(search => {
    const date = new Date(search.timestamp).toLocaleString('ru-RU');
    const keywords = search.keywords.join('; ');
    csv += `${date},"${keywords}",${search.city},${search.resultsCount},${search.exportedTo || '-'}\n`;
  });
  
  return csv;
}
