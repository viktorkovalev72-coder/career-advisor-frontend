import { useState, useCallback } from 'react';
import { Vacancy, SearchSource } from './types';
import { searchHeadHunter, searchTrudVsem, generateExternalLinks } from './services/api';
import { generatePDF } from './services/pdfGenerator';
import { Shield, Search, FileText, ExternalLink, Briefcase, MapPin, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';

const SEARCH_KEYWORDS = [
  'начальник службы безопасности',
  'начальник отдела безопасности',
  'руководитель службы безопасности',
  'сотрудник отдела безопасности',
  'специалист отдела безопасности',
  'охрана грузов при транспортировке',
  'сопровождение грузов',
  'охрана опасных грузов',
  'охрана коммерческих грузов',
  'начальник охраны грузов',
  'менеджер по безопасности перевозок',
  'инспектор по безопасности',
  'специалист по транспортной безопасности',
  'менеджер по логистической безопасности',
  'начальник отдела логистики и безопасности',
];

const EXTERNAL_KEYWORDS = [
  'начальник службы безопасности',
  'охрана грузов транспортировка',
  'сотрудник отдела безопасности',
  'сопровождение грузов',
  'охрана опасных грузов',
];

const CITY = 'Чебоксары';
const CITY_ID = 21;
const REGION_CODE = '21';

export default function AppBasic() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchSource[]>([
    { name: 'HeadHunter (API)', id: 'hh', status: 'idle', count: 0 },
    { name: 'Работа России (API)', id: 'trud', status: 'idle', count: 0 },
    { name: 'Внешние ссылки', id: 'ext', status: 'idle', count: 0 },
  ]);
  const [searchComplete, setSearchComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'sources' | 'about'>('about');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const performSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchComplete(false);
    setVacancies([]);
    setErrorMessage('');

    const sources: SearchSource[] = [
      { name: 'HeadHunter (API)', id: 'hh', status: 'loading', count: 0 },
      { name: 'Работа России (API)', id: 'trud', status: 'loading', count: 0 },
      { name: 'Внешние ссылки', id: 'ext', status: 'loading', count: 0 },
    ];
    setSearchProgress([...sources]);

    let allVacancies: Vacancy[] = [];

    try {
      const hhResults: Vacancy[] = [];
      for (const keyword of SEARCH_KEYWORDS) {
        try {
          const results = await searchHeadHunter(keyword, CITY_ID);
          hhResults.push(...results);
        } catch (e) {
          console.warn('HH error for keyword:', keyword, e);
        }
        await new Promise(r => setTimeout(r, 350));
      }
      const uniqueHH = deduplicateVacancies(hhResults);
      allVacancies.push(...uniqueHH);
      setSearchProgress(prev => prev.map(s =>
        s.id === 'hh' ? { ...s, status: 'success', count: uniqueHH.length } : s
      ));
    } catch (error) {
      setSearchProgress(prev => prev.map(s =>
        s.id === 'hh' ? { ...s, status: 'error', count: 0 } : s
      ));
    }

    try {
      const trudResults: Vacancy[] = [];
      for (const keyword of SEARCH_KEYWORDS) {
        try {
          const results = await searchTrudVsem(keyword, REGION_CODE);
          trudResults.push(...results);
        } catch (e) {
          console.warn('TrudVsem error for keyword:', keyword, e);
        }
        await new Promise(r => setTimeout(r, 350));
      }
      const uniqueTrud = deduplicateVacancies(trudResults);
      allVacancies.push(...uniqueTrud);
      setSearchProgress(prev => prev.map(s =>
        s.id === 'trud' ? { ...s, status: 'success', count: uniqueTrud.length } : s
      ));
    } catch (error) {
      setSearchProgress(prev => prev.map(s =>
        s.id === 'trud' ? { ...s, status: 'error', count: 0 } : s
      ));
    }

    try {
      const extLinks: Vacancy[] = [];
      for (const kw of EXTERNAL_KEYWORDS) {
        const links = generateExternalLinks(kw, CITY);
        extLinks.push(...links);
      }
      allVacancies.push(...extLinks);
      setSearchProgress(prev => prev.map(s =>
        s.id === 'ext' ? { ...s, status: 'success', count: extLinks.length } : s
      ));
    } catch (error) {
      setSearchProgress(prev => prev.map(s =>
        s.id === 'ext' ? { ...s, status: 'error', count: 0 } : s
      ));
    }

    if (allVacancies.length === 0) {
      setErrorMessage('Не удалось получить вакансии через API. Используйте прямые ссылки для поиска.');
    }

    setVacancies(allVacancies);
    setIsSearching(false);
    setSearchComplete(true);
    setActiveTab('results');
  }, []);

  const handleDownloadPDF = () => {
    try {
      generatePDF(vacancies, SEARCH_KEYWORDS);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Ошибка: ' + (error as Error).message);
    }
  };

  const grouped = groupBySource(vacancies);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Карьерный консультант</h1>
              <p className="text-blue-300 text-xs">Подбор вакансий • Безопасность и охрана грузов</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-blue-200 text-sm">{CITY}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-white text-xl font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                Подбор вакансий по безопасности и охране грузов
              </h2>
              <p className="text-blue-200/70 text-sm mt-1">
                Поиск на порталах: Работа России, hh.ru, Авито, Работа.ру, SuperJob и других
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={performSearch}
                disabled={isSearching}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Поиск...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Начать поиск
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Скачать PDF ({vacancies.length})
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-blue-300/60 text-xs mb-2">Ключевые запросы для поиска ({SEARCH_KEYWORDS.length} запросов):</p>
            <div className="flex flex-wrap gap-1.5">
              {SEARCH_KEYWORDS.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-200 text-xs">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {isSearching && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              Выполняется поиск...
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {searchProgress.map(source => (
                <div key={source.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{source.name}</span>
                    {source.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />}
                    {source.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {source.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  {source.status === 'success' && <p className="text-green-300 text-xs mt-1">Найдено: {source.count}</p>}
                  {source.status === 'loading' && <p className="text-yellow-300 text-xs mt-1">Загрузка...</p>}
                  {source.status === 'error' && <p className="text-red-300 text-xs mt-1">Ошибка загрузки</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {searchComplete && (
          <div className="mb-6">
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('results')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'results' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                Результаты ({vacancies.length})
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'sources' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                Источники
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'about' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                О подборе
              </button>
            </div>
          </div>
        )}

        {activeTab === 'results' && searchComplete && (
          <div>
            {errorMessage && (
              <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 text-sm font-medium">Внимание</p>
                  <p className="text-amber-200/70 text-xs mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([source, items]) => (
                <div key={source} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-4">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {source}
                    <span className="text-blue-300 text-sm font-normal">({items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((vacancy, i) => (
                      <a
                        key={vacancy.id + '-' + i}
                        href={vacancy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors truncate">
                            {vacancy.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-blue-200/60 text-xs">{vacancy.company}</span>
                            {vacancy.salary && <span className="text-emerald-300 text-xs font-medium">{vacancy.salary}</span>}
                            {vacancy.datePublished && <span className="text-blue-200/40 text-xs">{vacancy.datePublished}</span>}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-blue-400/50 group-hover:text-blue-400 flex-shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-blue-200/60 text-sm">Результаты поиска пусты. Нажмите «Начать поиск» для повторной попытки.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Источники поиска</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchProgress.map(source => (
                <div key={source.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{source.name}</span>
                    {source.status === 'success' && <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">{source.count} найдено</span>}
                    {source.status === 'error' && <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-full">Ошибка</span>}
                    {source.status === 'idle' && <span className="px-2 py-0.5 bg-gray-500/20 text-gray-300 text-xs rounded-full">Ожидание</span>}
                  </div>
                  <p className="text-blue-200/50 text-xs">
                    {source.id === 'hh' && 'API hh.ru — крупнейший портал вакансий России'}
                    {source.id === 'trud' && 'API портала «Работа России» (trudvsem.ru) — государственный портал'}
                    {source.id === 'ext' && 'Прямые ссылки на поиск: Авито, Работа.ру, SuperJob, Job.ru и др.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">О программе подбора</h3>
            <div className="space-y-4 text-blue-100/80 text-sm">
              <p>Данное приложение работает как профессиональный карьерный консультант с 30-летним опытом и выполняет автоматический подбор актуальных вакансий.</p>
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-white font-medium mb-2">Регион поиска:</h4>
                <p>Чебоксары, Чувашская Республика (код региона: 21)</p>
              </div>
            </div>
          </div>
        )}

        {!isSearching && !searchComplete && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">Готов к поиску</h3>
            <p className="text-blue-200/60 max-w-md mx-auto">
              Нажмите «Начать поиск» для подбора актуальных вакансий
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function deduplicateVacancies(vacancies: Vacancy[]): Vacancy[] {
  const seen = new Map<string, Vacancy>();
  vacancies.forEach(v => {
    const key = (v.title.toLowerCase().trim() + '_' + v.company.toLowerCase().trim());
    if (!seen.has(key)) seen.set(key, v);
  });
  return Array.from(seen.values());
}

function groupBySource(vacancies: Vacancy[]): Record<string, Vacancy[]> {
  const grouped: Record<string, Vacancy[]> = {};
  vacancies.forEach(v => {
    if (!grouped[v.source]) grouped[v.source] = [];
    grouped[v.source].push(v);
  });
  return grouped;
}
