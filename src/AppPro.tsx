import { useState, useCallback, useEffect } from 'react';
import { Vacancy, SearchFilters } from './types-pro';
import { searchAll, generateExternalLinks, checkServerHealth } from './services/api-pro';
import { CITIES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from './services/cities';
import { generatePDF } from './services/pdfGenerator-pro';
import { exportToExcel } from './services/excelExport';
import { calculateAnalytics } from './services/analytics';
import { getFavorites, toggleFavorite, isFavorite } from './services/favorites';
import { requestNotificationPermission, notifySearchComplete } from './services/notifications';
import { openMailClient } from './services/emailService';
import { checkSpelling, getSmartSuggestions } from './services/smartSearch';
import {
  Shield, Search, FileText, ExternalLink, Briefcase, MapPin,
  Loader2, CheckCircle, AlertCircle, Download, Table, Mail,
  Bell, Star, BarChart3, Filter, Plus, X, Settings
} from 'lucide-react';

export default function AppPro() {
  // Состояние фильтров
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [salaryFrom, setSalaryFrom] = useState<number | undefined>();
  const [salaryTo, setSalaryTo] = useState<number | undefined>();
  const [dateFrom, setDateFrom] = useState<string>('');
  const [selectedEmployment, setSelectedEmployment] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);

  // Результаты
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [favorites, setFavorites] = useState<Vacancy[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'favorites' | 'analytics' | 'about'>('search');

  // Email
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Тема приложения
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as 'dark' | 'light' | 'high-contrast') || 'dark';
  });

  // Инструкция
  const [showInstruction, setShowInstruction] = useState(false);

  // Применение темы
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Загрузка избранного
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Удаление ключевого слова
  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  // Поиск
  const performSearch = useCallback(async () => {
    if (keywords.length === 0) {
      alert('Добавьте хотя бы один ключевой запрос!');
      return;
    }

    setIsSearching(true);
    setSearchComplete(false);
    setVacancies([]);

    // Запрашиваем разрешение на уведомления
    await requestNotificationPermission();

    const filters: SearchFilters = {
      keywords,
      city: selectedCity.name,
      cityId: selectedCity.hhId,
      regionCode: selectedCity.trudCode,
      salaryFrom,
      salaryTo,
      dateFrom: dateFrom || undefined,
      employment: selectedEmployment,
      experience: selectedExperience,
    };

    let allVacancies: Vacancy[] = [];

    // Проверка работоспособности сервера
    const serverOk = await checkServerHealth();
    if (!serverOk) {
      alert('⚠️ Сервер недоступен!\n\nЗапустите сервер командой:\ncd server\nnpm install\nnpm run dev\n\nИли используйте только внешние ссылки.');
    }

    // Комплексный поиск через сервер
    try {
      const searchResults = await searchAll(filters);
      allVacancies.push(...searchResults);
      console.log(`[AppPro] Найдено через сервер: ${searchResults.length} вакансий`);
    } catch (e) {
      console.error('Search error:', e);
      alert('Ошибка поиска: ' + (e as Error).message);
    }

    // Внешние ссылки
    const extLinks = generateExternalLinks(filters);
    allVacancies.push(...extLinks);

    // Дедупликация
    const seen = new Map<string, Vacancy>();
    allVacancies.forEach(v => {
      const key = `${v.title.toLowerCase()}_${v.company.toLowerCase()}`;
      if (!seen.has(key)) seen.set(key, v);
    });

    const unique = Array.from(seen.values());
    setVacancies(unique);
    setIsSearching(false);
    setSearchComplete(true);
    setActiveTab('results');

    // Уведомление
    notifySearchComplete(unique.length);
  }, [keywords, selectedCity, salaryFrom, salaryTo, dateFrom, selectedEmployment, selectedExperience]);

  // Избранное
  const handleToggleFavorite = (vacancy: Vacancy) => {
    const updated = toggleFavorite(vacancy);
    setFavorites(updated);
  };

  // Экспорт в PDF
  const handleExportPDF = () => {
    const filters: SearchFilters = {
      keywords,
      city: selectedCity.name,
      cityId: selectedCity.hhId,
      regionCode: selectedCity.trudCode,
      salaryFrom,
      salaryTo,
      dateFrom: dateFrom || undefined,
      employment: selectedEmployment,
      experience: selectedExperience,
    };
    generatePDF(vacancies, filters);
  };

  // Экспорт в Excel
  const handleExportExcel = () => {
    exportToExcel(vacancies, 'vacancies_pro');
  };

  // Отправка на email
  const handleSendEmail = () => {
    if (!email) {
      alert('Введите email!');
      return;
    }
    openMailClient(email, vacancies, selectedCity.name);
    setShowEmailModal(false);
  };

  // Аналитика
  const analytics = searchComplete ? calculateAnalytics(vacancies) : null;

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' :
      theme === 'light' ? 'bg-gradient-to-br from-blue-50 via-white to-blue-50' :
      'bg-white'
    }`}>
      {/* Header */}
      <header className={`relative border-b backdrop-blur-sm ${
        theme === 'dark' ? 'border-blue-200/30 bg-gradient-to-r from-blue-600 to-blue-700' :
        theme === 'light' ? 'border-blue-200 bg-gradient-to-r from-blue-500 to-blue-600' :
        'border-black bg-black'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className={`font-bold text-base sm:text-lg flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' :
                  theme === 'light' ? 'text-white' :
                  'text-yellow-300'
                }`}>
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Карьерный консультант <span className={theme === 'high-contrast' ? 'text-yellow-300' : 'text-blue-200'}>PRO</span>
                </h1>
                <p className={`text-[10px] sm:text-xs ${
                  theme === 'dark' ? 'text-blue-100' :
                  theme === 'light' ? 'text-blue-100' :
                  'text-yellow-200'
                }`}>Расширенный поиск вакансий с аналитикой</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <a 
                href="https://czn.cap.ru/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
                title="Кадровый центр Работа России"
              >
                <img 
                  src="https://hh.kz/employer-logo/7208432.png" 
                  alt="Работа России" 
                  className="h-10 sm:h-14 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </a>
              <div className="flex items-center gap-1 sm:gap-2">
                <MapPin className={`w-3 h-3 sm:w-4 sm:h-4 ${theme === 'high-contrast' ? 'text-yellow-300' : 'text-blue-200'}`} />
                <span className={`text-xs sm:text-sm ${theme === 'high-contrast' ? 'text-white' : 'text-white'}`}>{selectedCity.name}</span>
              </div>
              {favorites.length > 0 && (
                <div className="flex items-center gap-1 text-yellow-300">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-300" />
                  <span className="text-xs sm:text-sm text-white">{favorites.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 ${
        theme === 'high-contrast' ? 'text-xl' : ''
      }`}>
        {/* Tabs */}
        <div className={`flex flex-wrap gap-1 rounded-xl p-1 mb-4 sm:mb-6 ${
          theme === 'dark' ? 'bg-white/5 border border-white/10' :
          theme === 'light' ? 'bg-blue-100 border border-blue-200' :
          'bg-yellow-100 border-2 border-black'
        }`}>
          {[
            { id: 'search', label: '🔍 Поиск', icon: Search },
            { id: 'results', label: `📋 Результаты (${vacancies.length})`, icon: FileText },
            { id: 'favorites', label: `⭐ Избранное (${favorites.length})`, icon: Star },
            { id: 'analytics', label: '📊 Аналитика', icon: BarChart3 },
            { id: 'about', label: 'ℹ️ О программе', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all sm:whitespace-nowrap cursor-pointer text-center ${
                activeTab === tab.id
                  ? theme === 'high-contrast' ? 'bg-yellow-400 text-black shadow-lg' : 'bg-blue-600 text-white shadow-lg'
                  : theme === 'high-contrast' ? 'text-black hover:bg-yellow-200' : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {/* Переключатель темы */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'high-contrast' : 'dark')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1 ${
              theme === 'high-contrast' ? 'bg-black text-yellow-300 hover:bg-gray-800' :
              theme === 'light' ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' :
              'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
            title={theme === 'dark' ? 'Светлая тема' : theme === 'light' ? 'Для слабовидящих' : 'Тёмная тема'}
          >
            {theme === 'dark' ? '☀️' : theme === 'light' ? '👁️' : '🌙'}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Светлая' : theme === 'light' ? 'Контраст' : 'Тёмная'}</span>
          </button>
          {/* Кнопка инструкции */}
          <button
            onClick={() => setShowInstruction(true)}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1 ${
              theme === 'high-contrast' ? 'bg-black text-yellow-300 hover:bg-gray-800' :
              theme === 'light' ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' :
              'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
            title="Инструкция по использованию"
          >
            ❓
            <span className="hidden sm:inline">Помощь</span>
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Keywords */}
            <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-6 ${
              theme === 'dark' ? 'bg-white/5 border border-white/10' :
              theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
              'bg-yellow-50 border-2 border-black'
            }`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>
                <Search className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'high-contrast' ? 'text-black' : 'text-blue-400'}`} />
                Ключевые запросы
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-3 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setNewKeyword(value);
                      // Получаем подсказки при вводе
                      if (value.length >= 2) {
                        const suggestions = await getSmartSuggestions(value);
                        setAutocompleteSuggestions(suggestions);
                      } else {
                        setAutocompleteSuggestions([]);
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newKeyword.trim()) {
                        // Проверяем орфографию перед добавлением
                        const corrected = await checkSpelling(newKeyword.trim());
                        if (corrected !== newKeyword.trim()) {
                          if (confirm(`Возможно, вы имели в виду "${corrected}"?\n\nДобавить исправленный вариант?`)) {
                            setKeywords([...keywords, corrected]);
                            setNewKeyword('');
                          } else {
                            setKeywords([...keywords, newKeyword.trim()]);
                            setNewKeyword('');
                          }
                        } else {
                          setKeywords([...keywords, newKeyword.trim()]);
                          setNewKeyword('');
                        }
                        setAutocompleteSuggestions([]);
                      }
                    }}
                    placeholder="Введите должность (например: начальник службы безопасности)"
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg text-sm focus:outline-none ${
                      theme === 'dark' ? 'bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-blue-500' :
                      theme === 'light' ? 'bg-blue-50 border border-blue-200 text-blue-900 placeholder-blue-400 focus:border-blue-500' :
                      'bg-white border-2 border-black text-black placeholder-gray-500 focus:border-yellow-500'
                    }`}
                  />
                  
                  {/* Выпадающий список подсказок */}
                  {autocompleteSuggestions.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${
                      theme === 'dark' ? 'bg-slate-800 border border-white/20' :
                      theme === 'light' ? 'bg-white border border-blue-200' :
                      'bg-yellow-50 border-2 border-black'
                    }`}>
                      {autocompleteSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setNewKeyword(suggestion);
                            setAutocompleteSuggestions([]);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            theme === 'dark' ? 'text-white hover:bg-white/10' :
                            theme === 'light' ? 'text-blue-900 hover:bg-blue-50' :
                            'text-black hover:bg-yellow-100'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={async () => {
                    if (newKeyword.trim()) {
                      // Проверяем орфографию перед добавлением
                      const corrected = await checkSpelling(newKeyword.trim());
                      if (corrected !== newKeyword.trim()) {
                        if (confirm(`Возможно, вы имели в виду "${corrected}"?\n\nДобавить исправленный вариант?`)) {
                          setKeywords([...keywords, corrected]);
                          setNewKeyword('');
                        } else {
                          setKeywords([...keywords, newKeyword.trim()]);
                          setNewKeyword('');
                        }
                      } else {
                        setKeywords([...keywords, newKeyword.trim()]);
                        setNewKeyword('');
                      }
                      setAutocompleteSuggestions([]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer text-sm font-medium ${
                    theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-yellow-500' :
                    'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span key={i} className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                    theme === 'dark' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200' :
                    theme === 'light' ? 'bg-blue-100 border border-blue-300 text-blue-800' :
                    'bg-yellow-200 border-2 border-black text-black'
                  }`}>
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className={`cursor-pointer ${
                      theme === 'high-contrast' ? 'hover:text-red-600' : 'hover:text-red-400'
                    }`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* City & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* City */}
              <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-6 ${
                theme === 'dark' ? 'bg-white/5 border border-white/10' :
                theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                'bg-yellow-50 border-2 border-black'
              }`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>
                <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'high-contrast' ? 'text-black' : 'text-blue-400'}`} />
                Город
              </h3>                <select
                  value={selectedCity.name}
                  onChange={e => {
                    const city = CITIES.find(c => c.name === e.target.value);
                    if (city) setSelectedCity(city);
                  }}
                  className={`w-full px-3 sm:px-4 py-2 rounded-lg text-sm focus:outline-none ${
                    theme === 'dark' ? 'bg-white/10 border border-white/20 text-white focus:border-blue-500' :
                    theme === 'light' ? 'bg-blue-50 border border-blue-200 text-blue-900 focus:border-blue-500' :
                    'bg-white border-2 border-black text-black focus:border-yellow-500'
                  }`}
                >
                  {CITIES.map(city => (
                    <option key={city.name} value={city.name} className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary */}
              <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-6 ${
                theme === 'dark' ? 'bg-white/5 border border-white/10' :
                theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                'bg-yellow-50 border-2 border-black'
              }`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>
                <Filter className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'high-contrast' ? 'text-black' : 'text-blue-400'}`} />
                Зарплата (₽)
              </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={salaryFrom || ''}
                    onChange={e => setSalaryFrom(e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full sm:flex-1 px-2 py-2 sm:px-3 rounded-lg text-xs sm:text-sm focus:outline-none ${
                      theme === 'dark' ? 'bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-blue-500' :
                      theme === 'light' ? 'bg-blue-50 border border-blue-200 text-blue-900 placeholder-blue-400 focus:border-blue-500' :
                      'bg-white border-2 border-black text-black placeholder-gray-500 focus:border-yellow-500'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={salaryTo || ''}
                    onChange={e => setSalaryTo(e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full sm:flex-1 px-2 py-2 sm:px-3 rounded-lg text-xs sm:text-sm focus:outline-none ${
                      theme === 'dark' ? 'bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-blue-500' :
                      theme === 'light' ? 'bg-blue-50 border border-blue-200 text-blue-900 placeholder-blue-400 focus:border-blue-500' :
                      'bg-white border-2 border-black text-black placeholder-gray-500 focus:border-yellow-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Employment & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`backdrop-blur-md rounded-2xl p-6 ${
                theme === 'dark' ? 'bg-white/5 border border-white/10' :
                theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                'bg-yellow-50 border-2 border-black'
              }`}>
                <h3 className={`font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' :
                  theme === 'light' ? 'text-blue-900' :
                  'text-black'
                }`}>Тип занятости</h3>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedEmployment(prev =>
                          prev.includes(type.id)
                            ? prev.filter(id => id !== type.id)
                            : [...prev, type.id]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                        selectedEmployment.includes(type.id)
                          ? theme === 'high-contrast' ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'
                          : theme === 'dark' ? 'bg-white/10 text-blue-200 hover:bg-white/20' :
                            theme === 'light' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            'bg-white border-2 border-black text-black hover:bg-yellow-100'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`backdrop-blur-md rounded-2xl p-6 ${
                theme === 'dark' ? 'bg-white/5 border border-white/10' :
                theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                'bg-yellow-50 border-2 border-black'
              }`}>
                <h3 className={`font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' :
                  theme === 'light' ? 'text-blue-900' :
                  'text-black'
                }`}>Опыт работы</h3>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level.id}
                      onClick={() => {
                        setSelectedExperience(prev =>
                          prev.includes(level.id)
                            ? prev.filter(id => id !== level.id)
                            : [...prev, level.id]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                        selectedExperience.includes(level.id)
                          ? theme === 'high-contrast' ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'
                          : theme === 'dark' ? 'bg-white/10 text-blue-200 hover:bg-white/20' :
                            theme === 'light' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            'bg-white border-2 border-black text-black hover:bg-yellow-100'
                      }`}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date filter */}
            <div className={`backdrop-blur-md rounded-2xl p-6 ${
              theme === 'dark' ? 'bg-white/5 border border-white/10' :
              theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
              'bg-yellow-50 border-2 border-black'
            }`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>
                <FileText className={`w-5 h-5 ${theme === 'high-contrast' ? 'text-black' : 'text-blue-400'}`} />
                Дата публикации (не ранее)
              </h3>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className={`px-4 py-2 rounded-lg focus:outline-none ${
                  theme === 'dark' ? 'bg-white/10 border border-white/20 text-white focus:border-blue-500' :
                  theme === 'light' ? 'bg-blue-50 border border-blue-200 text-blue-900 focus:border-blue-500' :
                  'bg-white border-2 border-black text-black focus:border-yellow-500'
                }`}
              />
            </div>

            {/* Search button */}
            <button
              onClick={performSearch}
              disabled={isSearching}
              className={`w-full py-3 sm:py-4 font-bold text-base sm:text-lg rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                theme === 'high-contrast' 
                  ? 'bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black shadow-black/25 disabled:bg-gray-400' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white shadow-blue-500/25'
              }`}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  Поиск...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  Начать поиск
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg cursor-pointer hover:from-emerald-500 hover:to-teal-500 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                Скачать PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg cursor-pointer hover:from-green-500 hover:to-emerald-500 text-xs sm:text-sm"
              >
                <Table className="w-3 h-3 sm:w-4 sm:h-4" />
                Экспорт Excel
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg cursor-pointer hover:from-blue-500 hover:to-cyan-500 text-xs sm:text-sm"
              >
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                Отправить на email
              </button>
            </div>

            {/* Vacancies list */}
            {vacancies.length > 0 ? (
              Object.entries(groupBySource(vacancies)).map(([source, items]) => (
                <div key={source} className={`backdrop-blur-md rounded-2xl p-3 sm:p-6 mb-4 ${
                  theme === 'dark' ? 'bg-white/5 border border-white/10' :
                  theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                  'bg-yellow-50 border-2 border-black'
                }`}>
                  <h3 className={`font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base ${
                    theme === 'dark' ? 'text-white' :
                    theme === 'light' ? 'text-blue-900' :
                    'text-black'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${theme === 'high-contrast' ? 'bg-black' : 'bg-blue-400'}`}></span>
                    {source}
                    <span className={`text-xs sm:text-sm font-normal ${
                      theme === 'dark' ? 'text-blue-300' :
                      theme === 'light' ? 'text-blue-600' :
                      'text-black'
                    }`}>({items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((vacancy, i) => (
                      <div
                        key={vacancy.id + '-' + i}
                        className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all group ${
                          theme === 'dark' ? 'bg-white/5 border border-white/5 hover:border-purple-500/30' :
                          theme === 'light' ? 'bg-blue-50 border border-blue-100 hover:border-blue-300' :
                          'bg-white border-2 border-black hover:border-yellow-500'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleFavorite(vacancy)}
                          className="flex-shrink-0 cursor-pointer"
                          title={isFavorite(vacancy.id) ? 'Убрать из избранного' : 'В избранное'}
                        >
                          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite(vacancy.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <a
                            href={vacancy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm font-medium transition-colors ${
                              theme === 'dark' ? 'text-white hover:text-blue-300' :
                              theme === 'light' ? 'text-blue-900 hover:text-blue-600' :
                              'text-black hover:text-yellow-700'
                            }`}
                          >
                            {vacancy.title}
                          </a>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-blue-200/60 text-xs">{vacancy.company}</span>
                            {vacancy.salary && (
                              <span className="text-emerald-300 text-xs font-medium">{vacancy.salary}</span>
                            )}
                            {vacancy.employment && (
                              <span className="text-blue-300/60 text-xs">💼 {vacancy.employment}</span>
                            )}
                            {vacancy.datePublished && (
                              <span className="text-blue-200/40 text-xs">{vacancy.datePublished}</span>
                            )}
                          </div>
                        </div>
                        <a href={vacancy.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-blue-400/50 group-hover:text-blue-400 flex-shrink-0" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
                <p className="text-purple-200/60">Нет результатов. Выполните поиск.</p>
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length > 0 ? (
              <div className="space-y-2">
                {favorites.map((vacancy, i) => (
                  <div
                    key={vacancy.id + '-' + i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-yellow-500/20"
                  >
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <a
                        href={vacancy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-sm font-medium hover:text-purple-300 transition-colors"
                      >
                        {vacancy.title}
                      </a>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-purple-200/60 text-xs">{vacancy.company}</span>
                        {vacancy.salary && (
                          <span className="text-emerald-300 text-xs font-medium">{vacancy.salary}</span>
                        )}
                        <span className="text-purple-300/40 text-xs">{vacancy.source}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={vacancy.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                      </a>
                      <button onClick={() => handleToggleFavorite(vacancy)} className="cursor-pointer">
                        <X className="w-4 h-4 text-red-400 hover:text-red-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-yellow-400/30 mx-auto mb-4" />
                <p className="text-purple-200/60">Избранных вакансий пока нет</p>
                <p className="text-purple-200/40 text-sm mt-2">Нажмите ⭐ рядом с вакансией, чтобы добавить в избранное</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-3 sm:space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-6 ${
                theme === 'dark' ? 'bg-white/5 border border-white/10' :
                theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                'bg-yellow-50 border-2 border-black'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-blue-200/60' :
                  theme === 'light' ? 'text-blue-600' :
                  'text-black'
                }`}>Всего вакансий</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-2 ${
                  theme === 'dark' ? 'text-white' :
                  theme === 'light' ? 'text-blue-900' :
                  'text-black'
                }`}>{analytics.totalVacancies}</p>
              </div>
              <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-6 ${
                theme === 'dark' ? 'bg-white/5 border border-white/10' :
                theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                'bg-yellow-50 border-2 border-black'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-blue-200/60' :
                  theme === 'light' ? 'text-blue-600' :
                  'text-black'
                }`}>Средняя зарплата</p>
                <p className={`text-xl sm:text-3xl font-bold mt-2 break-words ${
                  theme === 'dark' ? 'text-emerald-300' :
                  theme === 'light' ? 'text-green-600' :
                  'text-black'
                }`}>
                  {analytics.averageSalary > 0 ? `${analytics.averageSalary.toLocaleString('ru-RU')} ₽` : '—'}
                </p>
              </div>
              <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-6 ${
                theme === 'dark' ? 'bg-white/5 border border-white/10' :
                theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
                'bg-yellow-50 border-2 border-black'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-blue-200/60' :
                  theme === 'light' ? 'text-blue-600' :
                  'text-black'
                }`}>Источников</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-2 ${
                  theme === 'dark' ? 'text-white' :
                  theme === 'light' ? 'text-blue-900' :
                  'text-black'
                }`}>{Object.keys(analytics.bySource).length}</p>
              </div>
            </div>

            {/* By source */}
            <div className={`backdrop-blur-md rounded-2xl p-3 sm:p-6 ${
              theme === 'dark' ? 'bg-white/5 border border-white/10' :
              theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
              'bg-yellow-50 border-2 border-black'
            }`}>
              <h3 className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>По источникам</h3>
              <div className="space-y-2">
                {Object.entries(analytics.bySource).map(([source, count]) => (
                  <div key={source} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className={`text-xs sm:text-sm sm:w-40 break-words ${
                      theme === 'dark' ? 'text-blue-200' :
                      theme === 'light' ? 'text-blue-800' :
                      'text-black'
                    }`}>{source}</span>
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className={`flex-1 rounded-full h-3 sm:h-4 overflow-hidden ${
                        theme === 'dark' ? 'bg-white/10' :
                        theme === 'light' ? 'bg-blue-100' :
                        'bg-yellow-200'
                      }`}>
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          style={{ width: `${(count / analytics.totalVacancies) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs sm:text-sm font-medium w-10 sm:w-12 text-right ${
                        theme === 'dark' ? 'text-white' :
                        theme === 'light' ? 'text-blue-900' :
                        'text-black'
                      }`}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary distribution */}
            <div className={`backdrop-blur-md rounded-2xl p-3 sm:p-6 ${
              theme === 'dark' ? 'bg-white/5 border border-white/10' :
              theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
              'bg-yellow-50 border-2 border-black'
            }`}>
              <h3 className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>Распределение зарплат</h3>
              <div className="space-y-2">
                {analytics.salaryDistribution.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className={`text-xs sm:text-sm sm:w-40 break-words ${
                      theme === 'dark' ? 'text-blue-200' :
                      theme === 'light' ? 'text-blue-800' :
                      'text-black'
                    }`}>{item.range}</span>
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className={`flex-1 rounded-full h-3 sm:h-4 overflow-hidden ${
                        theme === 'dark' ? 'bg-white/10' :
                        theme === 'light' ? 'bg-blue-100' :
                        'bg-yellow-200'
                      }`}>
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${analytics.totalVacancies > 0 ? (item.count / analytics.totalVacancies) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs sm:text-sm font-medium w-10 sm:w-12 text-right ${
                        theme === 'dark' ? 'text-white' :
                        theme === 'light' ? 'text-blue-900' :
                        'text-black'
                      }`}>{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By employment */}
            <div className={`backdrop-blur-md rounded-2xl p-3 sm:p-6 ${
              theme === 'dark' ? 'bg-white/5 border border-white/10' :
              theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
              'bg-yellow-50 border-2 border-black'
            }`}>
              <h3 className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>По типу занятости</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(analytics.byEmployment).map(([type, count]) => (
                  <div key={type} className={`rounded-lg p-2 sm:p-3 ${
                    theme === 'dark' ? 'bg-white/5 border border-white/5' :
                    theme === 'light' ? 'bg-blue-50 border border-blue-200' :
                    'bg-yellow-100 border-2 border-black'
                  }`}>
                    <p className={`text-xs break-words ${
                      theme === 'dark' ? 'text-blue-200' :
                      theme === 'light' ? 'text-blue-800' :
                      'text-black'
                    }`}>{type}</p>
                    <p className={`text-base sm:text-lg font-bold ${
                      theme === 'dark' ? 'text-white' :
                      theme === 'light' ? 'text-blue-900' :
                      'text-black'
                    }`}>{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className={`backdrop-blur-md rounded-2xl p-6 ${
            theme === 'dark' ? 'bg-white/5 border border-white/10' :
            theme === 'light' ? 'bg-white border border-blue-200 shadow-md' :
            'bg-yellow-50 border-2 border-black'
          }`}>
            <div className="mb-6">
              <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>
                <Shield className={`w-5 h-5 flex-shrink-0 ${theme === 'high-contrast' ? 'text-black' : 'text-blue-300'}`} />
                Карьерный консультант PRO
              </h3>
              <a 
                href="https://czn.cap.ru/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-sm hover:underline transition-colors inline-flex items-center gap-1 mt-1 ${
                  theme === 'dark' ? 'text-blue-200 hover:text-blue-100' :
                  theme === 'light' ? 'text-blue-600 hover:text-blue-800' :
                  'text-black hover:text-yellow-700 underline'
                }`}
              >
                Кадровый центр "Работа России" Чувашской Республики
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className={`space-y-4 text-sm ${
              theme === 'dark' ? 'text-blue-100/80' :
              theme === 'light' ? 'text-blue-800' :
              'text-black'
            }`}>

              <p>Расширенная версия приложения для профессионального подбора вакансий с использованием официальных источников.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-xl p-4 ${
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' :
                  theme === 'light' ? 'bg-blue-50 border border-blue-200' :
                  'bg-yellow-100 border-2 border-black'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' :
                    theme === 'light' ? 'text-blue-900' :
                    'text-black'
                  }`}>🔍 Гибкий поиск</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Пользовательские ключевые запросы</li>
                    <li>• Выбор из городов ПФО</li>
                    <li>• Фильтр по зарплате (от/до)</li>
                    <li>• Фильтр по дате публикации</li>
                  </ul>
                </div>
                <div className={`rounded-xl p-4 ${
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' :
                  theme === 'light' ? 'bg-blue-50 border border-blue-200' :
                  'bg-yellow-100 border-2 border-black'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' :
                    theme === 'light' ? 'text-blue-900' :
                    'text-black'
                  }`}>💼 Фильтры</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Тип занятости (полная, удалёнка, вахта)</li>
                    <li>• Уровень опыта</li>
                    <li>• Автоматическая дедупликация</li>
                  </ul>
                </div>
                <div className={`rounded-xl p-4 ${
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' :
                  theme === 'light' ? 'bg-blue-50 border border-blue-200' :
                  'bg-yellow-100 border-2 border-black'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' :
                    theme === 'light' ? 'text-blue-900' :
                    'text-black'
                  }`}>💾 Сохранение</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Избранные вакансии</li>
                    <li>• Экспорт в PDF (на русском)</li>
                    <li>• Экспорт в Excel</li>
                    <li>• Отправка на email</li>
                  </ul>
                </div>
                <div className={`rounded-xl p-4 ${
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' :
                  theme === 'light' ? 'bg-blue-50 border border-blue-200' :
                  'bg-yellow-100 border-2 border-black'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' :
                    theme === 'light' ? 'text-blue-900' :
                    'text-black'
                  }`}>📊 Аналитика</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Средняя зарплата</li>
                    <li>• Распределение по источникам</li>
                    <li>• Распределение зарплат</li>
                    <li>• Статистика по типу занятости</li>
                  </ul>
                </div>
              </div>

              <div className={`rounded-xl p-4 ${
                theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                theme === 'light' ? 'bg-green-50 border border-green-200' :
                'bg-yellow-100 border-2 border-black'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' :
                  theme === 'light' ? 'text-green-900' :
                  'text-black'
                }`}>🔔 Уведомления</h4>
                <p className="text-xs">Приложение поддерживает push-уведомления о завершении поиска и новых вакансиях.</p>
              </div>

              <div className={`rounded-xl p-4 mt-6 ${
                theme === 'dark' ? 'bg-blue-600/10 border border-blue-500/20' :
                theme === 'light' ? 'bg-blue-50 border border-blue-200' :
                'bg-yellow-100 border-2 border-black'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' :
                  theme === 'light' ? 'text-blue-900' :
                  'text-black'
                }`}>🔗 Полезные ссылки</h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <a href="https://czn.cap.ru/" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${
                      theme === 'dark' ? 'text-blue-300 hover:text-blue-200' :
                      theme === 'light' ? 'text-blue-600 hover:text-blue-800' :
                      'text-black hover:text-yellow-700 underline'
                    }`}>
                      <ExternalLink className="w-3 h-3" />
                      Кадровый центр "Работа России" Чувашской Республики
                    </a>
                  </li>
                  <li>
                    <a href="https://trudvsem.ru/" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${
                      theme === 'dark' ? 'text-blue-300 hover:text-blue-200' :
                      theme === 'light' ? 'text-blue-600 hover:text-blue-800' :
                      'text-black hover:text-yellow-700 underline'
                    }`}>
                      <ExternalLink className="w-3 h-3" />
                      Портал "Работа России" (федеральный)
                    </a>
                  </li>
                  <li>
                    <a href="https://vk.ru/czn_cheb" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${
                      theme === 'dark' ? 'text-blue-300 hover:text-blue-200' :
                      theme === 'light' ? 'text-blue-600 hover:text-blue-800' :
                      'text-black hover:text-yellow-700 underline'
                    }`}>
                      <ExternalLink className="w-3 h-3" />
                      Официальная страничка Вконтакте Кадрового центра "Работа России" Чувашской Республики
                    </a>
                  </li>
                  <li>
                    <a href="https://vk.ru/viktorkovalev" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${
                      theme === 'dark' ? 'text-blue-300 hover:text-blue-200' :
                      theme === 'light' ? 'text-blue-600 hover:text-blue-800' :
                      'text-black hover:text-yellow-700 underline'
                    }`}>
                      <ExternalLink className="w-3 h-3" />
                      Официальная страничка Вконтакте директора Кадрового центра "Работа России" Чувашской Республики
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full ${
            theme === 'dark' ? 'bg-slate-800 border border-white/10' :
            theme === 'light' ? 'bg-white border border-blue-200' :
            'bg-yellow-50 border-2 border-black'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' :
              theme === 'light' ? 'text-blue-900' :
              'text-black'
            }`}>
              <Mail className={`w-5 h-5 ${theme === 'high-contrast' ? 'text-black' : 'text-blue-400'}`} />
              Отправить отчёт на email
            </h3>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Введите email"
              className={`w-full px-4 py-2 rounded-lg mb-4 focus:outline-none ${
                theme === 'dark' ? 'bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-purple-500' :
                theme === 'light' ? 'bg-blue-50 border border-blue-200 text-blue-900 placeholder-blue-400 focus:border-blue-500' :
                'bg-white border-2 border-black text-black placeholder-gray-500 focus:border-yellow-500'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSendEmail}
                className={`flex-1 py-2 rounded-lg cursor-pointer ${
                  theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-yellow-500' :
                  'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                Отправить
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className={`flex-1 py-2 rounded-lg cursor-pointer ${
                  theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' :
                  theme === 'light' ? 'bg-blue-100 hover:bg-blue-200 text-blue-900' :
                  'bg-gray-200 hover:bg-gray-300 text-black'
                }`}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Инструкция */}
      {showInstruction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4 flex items-start justify-center overflow-y-auto">
          <div className={`rounded-2xl p-6 max-w-3xl w-full my-8 ${
            theme === 'dark' ? 'bg-slate-800 border border-white/10' :
            theme === 'light' ? 'bg-white border border-blue-200 shadow-xl' :
            'bg-yellow-50 border-2 border-black'
          } ${theme === 'high-contrast' ? 'text-base' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-bold text-xl flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' :
                theme === 'light' ? 'text-blue-900' :
                'text-black'
              }`}>
                📖 Инструкция по использованию
              </h3>
              <button
                onClick={() => setShowInstruction(false)}
                className={`p-2 rounded-lg cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-white/10 text-white' :
                  theme === 'light' ? 'hover:bg-blue-100 text-blue-900' :
                  'hover:bg-gray-200 text-black'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-6 ${
              theme === 'dark' ? 'text-blue-100' :
              theme === 'light' ? 'text-blue-800' :
              'text-black'
            } ${theme === 'high-contrast' ? 'text-lg leading-relaxed' : 'text-sm'}`}>
              
              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  🎯 Для чего нужно приложение?
                </h4>
                <p>
                  Карьерный консультант PRO - это профессиональный инструмент для поиска вакансий в городах Приволжского федерального округа (ПФО). 
                  Приложение интегрируется с популярными порталами по поиску работы (hh.ru, Работа России, Авито, SuperJob и др.) и позволяет 
                  находить актуальные вакансии по вашим критериям.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  🚀 С чего начать?
                </h4>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong>Введите ключевой запрос:</strong> в поле "Ключевые запросы" введите интересующую вас должность 
                    (например: "начальник службы безопасности", "водитель", "менеджер")
                  </li>
                  <li>
                    <strong>Добавьте запрос:</strong> нажмите кнопку "Добавить" или клавишу Enter. Вы можете добавить несколько запросов для расширения поиска.
                  </li>
                  <li>
                    <strong>Выберите город:</strong> в выпадающем списке "Город" выберите интересующий вас город из 14 городов ПФО 
                    (Чебоксары, Казань, Нижний Новгород и др.)
                  </li>
                  <li>
                    <strong>Настройте фильтры (опционально):</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li><strong>Зарплата:</strong> укажите желаемый диапазон зарплаты (от/до)</li>
                      <li><strong>Тип занятости:</strong> выберите полную, частичную, удалённую работу, вахту или стажировку</li>
                      <li><strong>Опыт работы:</strong> укажите ваш уровень опыта</li>
                      <li><strong>Дата публикации:</strong> выберите дату, не ранее которой должны быть опубликованы вакансии</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Начните поиск:</strong> нажмите большую синюю кнопку "Начать поиск"
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  📋 Что делать после поиска?
                </h4>
                <p className="mb-2">
                  После завершения поиска автоматически откроется вкладка "Результаты", где вы увидите:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Список вакансий:</strong> сгруппированных по источникам (hh.ru, Работа России, Авито и др.)
                  </li>
                  <li>
                    <strong>Карточки вакансий:</strong> с названием должности, компанией, зарплатой и ссылкой
                  </li>
                  <li>
                    <strong>Кнопка ⭐:</strong> нажмите для добавления вакансии в избранное
                  </li>
                  <li>
                    <strong>Кликабельные ссылки:</strong> нажмите на вакансию для перехода на сайт работодателя
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  💾 Как сохранить результаты?
                </h4>
                <p className="mb-2">В верхней части вкладки "Результаты" доступны три кнопки:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>📥 Скачать PDF:</strong> создаёт PDF-документ со всеми найденными вакансиями на русском языке
                  </li>
                  <li>
                    <strong>📊 Экспорт Excel:</strong> скачивает таблицу Excel с полной информацией о вакансиях
                  </li>
                  <li>
                    <strong>📧 Отправить на email:</strong> открывает почтовый клиент с готовым письмом со списком вакансий
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  ⭐ Как работать с избранным?
                </h4>
                <p>
                  Нажмите на вкладку "Избранное" чтобы увидеть все сохранённые вакансии. 
                  Избранные вакансии сохраняются в браузере и остаются доступными даже после перезагрузки страницы.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  📊 Как использовать аналитику?
                </h4>
                <p>
                  На вкладке "Аналитика" вы увидите:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Общее количество найденных вакансий</li>
                  <li>Среднюю зарплату по результатам поиска</li>
                  <li>Распределение вакансий по источникам</li>
                  <li>Графики распределения зарплат</li>
                  <li>Статистику по типам занятости</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  🎨 Как изменить тему оформления?
                </h4>
                <p>
                  В панели табов есть кнопка переключения темы:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>☀️ Светлая тема:</strong> светлый фон, тёмный текст</li>
                  <li><strong>🌙 Тёмная тема:</strong> тёмный фон, светлый текст (по умолчанию)</li>
                  <li><strong>👁️ Для слабовидящих:</strong> высокий контраст, крупные шрифты</li>
                </ul>
                <p className="mt-2">Выбранная тема сохраняется автоматически.</p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  📱 Мобильная версия
                </h4>
                <p>
                  Приложение полностью адаптировано для мобильных устройств. Все функции доступны на смартфонах и планшетах.
                  Табы автоматически переносятся в две строки для удобства использования на маленьких экранах.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  💡 Советы
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Используйте несколько ключевых запросов для более широкого поиска</li>
                  <li>Фильтр по зарплате помогает найти вакансии в вашем ценовом диапазоне</li>
                  <li>Сохраняйте интересные вакансии в избранное для быстрого доступа</li>
                  <li>Экспортируйте результаты в Excel для дальнейшего анализа</li>
                  <li>Используйте аналитику для понимания рынка труда в вашем регионе</li>
                </ul>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-blue-500/20 border border-blue-500/30' :
                theme === 'light' ? 'bg-blue-100 border border-blue-300' :
                'bg-yellow-200 border-2 border-black'
              }`}>
                <h4 className="font-bold mb-2">📞 Поддержка</h4>
                <p>
                  Если у вас возникли вопросы или проблемы с использованием приложения, 
                  обратитесь в Кадровый центр "Работа России" Чувашской Республики:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>
                    <a href="https://czn.cap.ru/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      https://czn.cap.ru/
                    </a>
                  </li>
                  <li>
                    <a href="https://vk.ru/czn_cheb" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      ВКонтакте: Кадровый центр
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInstruction(false)}
                className={`px-6 py-2 rounded-lg cursor-pointer font-medium ${
                  theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-yellow-500' :
                  'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                Понятно, закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function groupBySource(vacancies: Vacancy[]): Record<string, Vacancy[]> {
  const grouped: Record<string, Vacancy[]> = {};
  vacancies.forEach(v => {
    if (!grouped[v.source]) grouped[v.source] = [];
    grouped[v.source].push(v);
  });
  return grouped;
}
