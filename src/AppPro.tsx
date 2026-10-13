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
import {
  Shield, Search, FileText, ExternalLink, Briefcase, MapPin,
  Loader2, CheckCircle, AlertCircle, Download, Table, Mail,
  Bell, Star, BarChart3, Filter, Plus, X, Settings
} from 'lucide-react';

export default function AppPro() {
  // Состояние фильтров
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
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

  // Загрузка избранного
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Добавление ключевого слова
  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-200/30 backdrop-blur-sm bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center">
            <div>
              <h1 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 flex-shrink-0" />
                Карьерный консультант <span className="text-blue-200">PRO</span>
              </h1>
              <p className="text-blue-100 text-[10px] sm:text-xs">Расширенный поиск вакансий с аналитикой</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200" />
              <span className="text-white text-xs sm:text-sm">{selectedCity.name}</span>
            </div>
            {favorites.length > 0 && (
              <div className="flex items-center gap-1 text-yellow-300">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-300" />
                <span className="text-xs sm:text-sm text-white">{favorites.length}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
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
              className={`flex-1 min-w-fit px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Keywords */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                Ключевые запросы
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  placeholder="Введите должность (например: начальник службы безопасности)"
                  className="flex-1 px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  onClick={addKeyword}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-1 cursor-pointer text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-200 text-xs sm:text-sm">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-red-400 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* City & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* City */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                Город
              </h3>                <select
                  value={selectedCity.name}
                  onChange={e => {
                    const city = CITIES.find(c => c.name === e.target.value);
                    if (city) setSelectedCity(city);
                  }}
                  className="w-full px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  {CITIES.map(city => (
                    <option key={city.name} value={city.name} className="bg-gray-800">
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                Зарплата (₽)
              </h3>                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={salaryFrom || ''}
                    onChange={e => setSalaryFrom(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={salaryTo || ''}
                    onChange={e => setSalaryTo(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Employment & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Тип занятости</h3>
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
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Опыт работы</h3>
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
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date filter */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Дата публикации (не ранее)
              </h3>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Search button */}
            <button
              onClick={performSearch}
              disabled={isSearching}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold text-base sm:text-lg rounded-xl transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <div key={source} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-6 mb-4">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {source}
                    <span className="text-blue-300 text-xs sm:text-sm font-normal">({items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((vacancy, i) => (
                      <div
                        key={vacancy.id + '-' + i}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group"
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
                            className="text-white text-sm font-medium hover:text-blue-300 transition-colors"
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
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
                <p className="text-blue-200/60 text-xs sm:text-sm">Всего вакансий</p>
                <p className="text-white text-2xl sm:text-3xl font-bold mt-2">{analytics.totalVacancies}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
                <p className="text-blue-200/60 text-xs sm:text-sm">Средняя зарплата</p>
                <p className="text-emerald-300 text-xl sm:text-3xl font-bold mt-2 break-words">
                  {analytics.averageSalary > 0 ? `${analytics.averageSalary.toLocaleString('ru-RU')} ₽` : '—'}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
                <p className="text-blue-200/60 text-xs sm:text-sm">Источников</p>
                <p className="text-white text-2xl sm:text-3xl font-bold mt-2">{Object.keys(analytics.bySource).length}</p>
              </div>
            </div>

            {/* By source */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-6">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">По источникам</h3>
              <div className="space-y-2">
                {Object.entries(analytics.bySource).map(([source, count]) => (
                  <div key={source} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-blue-200 text-xs sm:text-sm sm:w-40 break-words">{source}</span>
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="flex-1 bg-white/10 rounded-full h-3 sm:h-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          style={{ width: `${(count / analytics.totalVacancies) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-xs sm:text-sm font-medium w-10 sm:w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary distribution */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-6">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Распределение зарплат</h3>
              <div className="space-y-2">
                {analytics.salaryDistribution.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-blue-200 text-xs sm:text-sm sm:w-40 break-words">{item.range}</span>
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="flex-1 bg-white/10 rounded-full h-3 sm:h-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${analytics.totalVacancies > 0 ? (item.count / analytics.totalVacancies) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-xs sm:text-sm font-medium w-10 sm:w-12 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By employment */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-6">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">По типу занятости</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(analytics.byEmployment).map(([type, count]) => (
                  <div key={type} className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/5">
                    <p className="text-blue-200 text-xs break-words">{type}</p>
                    <p className="text-white text-base sm:text-lg font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-300 flex-shrink-0" />
                Карьерный консультант PRO
              </h3>
              <a 
                href="https://czn.cap.ru/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-200 text-sm hover:text-blue-100 hover:underline transition-colors inline-flex items-center gap-1 mt-1"
              >
                Кадровый центр "Работа России" Чувашской Республики
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="space-y-4 text-blue-100/80 text-sm">

              <p>Расширенная версия приложения для профессионального подбора вакансий с использованием официальных источников.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">🔍 Гибкий поиск</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Пользовательские ключевые запросы</li>
                    <li>• Выбор из городов ПФО</li>
                    <li>• Фильтр по зарплате (от/до)</li>
                    <li>• Фильтр по дате публикации</li>
                  </ul>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">💼 Фильтры</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Тип занятости (полная, удалёнка, вахта)</li>
                    <li>• Уровень опыта</li>
                    <li>• Автоматическая дедупликация</li>
                  </ul>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">💾 Сохранение</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Избранные вакансии</li>
                    <li>• Экспорт в PDF (на русском)</li>
                    <li>• Экспорт в Excel</li>
                    <li>• Отправка на email</li>
                  </ul>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">📊 Аналитика</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Средняя зарплата</li>
                    <li>• Распределение по источникам</li>
                    <li>• Распределение зарплат</li>
                    <li>• Статистика по типу занятости</li>
                  </ul>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <h4 className="text-white font-medium mb-2">🔔 Уведомления</h4>
                <p className="text-xs">Приложение поддерживает push-уведомления о завершении поиска и новых вакансиях.</p>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                <h4 className="text-white font-medium mb-2">🔗 Полезные ссылки</h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <a href="https://czn.cap.ru/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" />
                      Кадровый центр "Работа России" Чувашской Республики
                    </a>
                  </li>
                  <li>
                    <a href="https://trudvsem.ru/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" />
                      Портал "Работа России" (федеральный)
                    </a>
                  </li>
                  <li>
                    <a href="https://vk.ru/czn_cheb" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" />
                      Официальная страничка Вконтакте Кадрового центра "Работа России" Чувашской Республики
                    </a>
                  </li>
                  <li>
                    <a href="https://vk.ru/viktorkovalev" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 flex items-center gap-2">
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
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Отправить отчёт на email
            </h3>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Введите email"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSendEmail}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
              >
                Отправить
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
              >
                Отмена
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
