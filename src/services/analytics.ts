import { Vacancy, MarketAnalytics } from '../types-pro';

export function calculateAnalytics(vacancies: Vacancy[]): MarketAnalytics {
  const totalVacancies = vacancies.length;

  // Средняя зарплата
  const salaries = vacancies
    .filter(v => v.salaryFrom && v.salaryTo)
    .map(v => (v.salaryFrom! + v.salaryTo!) / 2);
  
  const averageSalary = salaries.length > 0
    ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
    : 0;

  // По источникам
  const bySource: Record<string, number> = {};
  vacancies.forEach(v => {
    bySource[v.source] = (bySource[v.source] || 0) + 1;
  });

  // По типу занятости
  const byEmployment: Record<string, number> = {};
  vacancies.forEach(v => {
    const emp = v.employment || 'Не указан';
    byEmployment[emp] = (byEmployment[emp] || 0) + 1;
  });

  // Распределение зарплат
  const salaryRanges = [
    { min: 0, max: 30000, label: 'до 30 000 ₽' },
    { min: 30000, max: 50000, label: '30 000 - 50 000 ₽' },
    { min: 50000, max: 80000, label: '50 000 - 80 000 ₽' },
    { min: 80000, max: 120000, label: '80 000 - 120 000 ₽' },
    { min: 120000, max: 200000, label: '120 000 - 200 000 ₽' },
    { min: 200000, max: Infinity, label: 'более 200 000 ₽' },
  ];

  const salaryDistribution = salaryRanges.map(range => ({
    range: range.label,
    count: vacancies.filter(v => {
      const avg = v.salaryFrom && v.salaryTo ? (v.salaryFrom + v.salaryTo) / 2 : 0;
      return avg >= range.min && avg < range.max;
    }).length,
  }));

  return {
    totalVacancies,
    averageSalary,
    bySource,
    byEmployment,
    salaryDistribution,
  };
}
