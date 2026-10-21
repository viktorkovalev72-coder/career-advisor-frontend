import { useState, useEffect } from 'react';
import {
  getStatistics,
  getTopKeywords,
  getTopCities,
  clearStatistics,
  exportStatisticsToJSON,
  exportStatisticsToCSV,
  checkAdminPassword,
  AppStatistics,
} from '../services/statistics';
import {
  Shield,
  Lock,
  BarChart3,
  TrendingUp,
  MapPin,
  Briefcase,
  Download,
  Trash2,
  LogOut,
  Calendar,
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<AppStatistics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      setStats(getStatistics());
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (checkAdminPassword(password)) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  const handleClearStats = () => {
    if (confirm('Вы уверены, что хотите удалить всю статистику? Это действие нельзя отменить.')) {
      clearStatistics();
      setStats(getStatistics());
    }
  };

  const handleExportJSON = () => {
    const json = exportStatisticsToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = exportStatisticsToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Экран входа
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Админ-панель</h2>
              <p className="text-blue-200 text-sm">Введите пароль для доступа</p>
            </div>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Пароль"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 mb-4"
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
            >
              Войти
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
            >
              Отмена
            </button>
          </div>

          <p className="text-blue-200/60 text-xs mt-4 text-center">
            Пароль по умолчанию: admin2024
          </p>
        </div>
      </div>
    );
  }

  // Админ-панель
  if (!stats) return null;

  const topKeywords = getTopKeywords(10);
  const topCities = getTopCities(10);

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl">Админ-панель</h1>
              <p className="text-blue-200 text-sm">Статистика использования приложения</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <p className="text-blue-200/60 text-sm">Всего поисков</p>
            </div>
            <p className="text-white text-4xl font-bold">{stats.totalSearches}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-8 h-8 text-emerald-400" />
              <p className="text-blue-200/60 text-sm">Всего экспортов</p>
            </div>
            <p className="text-white text-4xl font-bold">{stats.totalExports}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-purple-400" />
              <p className="text-blue-200/60 text-sm">Поисков сегодня</p>
            </div>
            <p className="text-white text-4xl font-bold">
              {stats.dailyStats[new Date().toISOString().split('T')[0]] || 0}
            </p>
          </div>
        </div>

        {/* Действия */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Экспорт JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Экспорт CSV
          </button>
          <button
            onClick={handleClearStats}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Очистить статистику
          </button>
        </div>

        {/* Рейтинг ключевых слов */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Топ-10 ключевых запросов
          </h3>
          {topKeywords.length > 0 ? (
            <div className="space-y-2">
              {topKeywords.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-blue-200 text-sm w-8">{i + 1}.</span>
                  <span className="text-white text-sm flex-1">{item.keyword}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{ width: `${(item.count / stats.totalSearches) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white text-sm font-medium w-12 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-blue-200/60 text-sm">Нет данных</p>
          )}
        </div>

        {/* Рейтинг городов */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Топ-10 городов
          </h3>
          {topCities.length > 0 ? (
            <div className="space-y-2">
              {topCities.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-blue-200 text-sm w-8">{i + 1}.</span>
                  <span className="text-white text-sm flex-1">{item.city}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${(item.count / stats.totalSearches) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white text-sm font-medium w-12 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-blue-200/60 text-sm">Нет данных</p>
          )}
        </div>

        {/* Тип занятости */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              Тип занятости
            </h3>
            {Object.keys(stats.employmentRating).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.employmentRating).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-white text-sm">{type}</span>
                    <span className="text-blue-200 text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-200/60 text-sm">Нет данных</p>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Опыт работы
            </h3>
            {Object.keys(stats.experienceRating).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.experienceRating).map(([exp, count]) => (
                  <div key={exp} className="flex items-center justify-between">
                    <span className="text-white text-sm">{exp}</span>
                    <span className="text-blue-200 text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-200/60 text-sm">Нет данных</p>
            )}
          </div>
        </div>

        {/* Последние поиски */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Последние 10 поисков
          </h3>
          {stats.searches.length > 0 ? (
            <div className="space-y-2">
              {stats.searches
                .slice(-10)
                .reverse()
                .map((search) => (
                  <div
                    key={search.id}
                    className="bg-white/5 rounded-lg p-3 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">
                        {new Date(search.timestamp).toLocaleString('ru-RU')}
                      </span>
                      <span className="text-blue-200 text-xs">
                        {search.resultsCount} результатов
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-blue-200 text-xs">
                        📍 {search.city}
                      </span>
                      <span className="text-blue-200 text-xs">
                        🔍 {search.keywords.join(', ')}
                      </span>
                      {search.exportedTo && (
                        <span className="text-emerald-300 text-xs">
                          📥 {search.exportedTo.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-blue-200/60 text-sm">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  );
}
