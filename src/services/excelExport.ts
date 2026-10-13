import * as XLSX from 'xlsx';
import { Vacancy } from '../types-pro';

export function exportToExcel(vacancies: Vacancy[], filename: string = 'vacancies'): void {
  const data = vacancies.map((v, i) => ({
    '№': i + 1,
    'Название вакансии': v.title,
    'Компания': v.company,
    'Зарплата': v.salary || 'Не указана',
    'Город': v.location,
    'Источник': v.source,
    'Дата публикации': v.datePublished || 'Не указана',
    'Тип занятости': v.employment || 'Не указан',
    'Опыт': v.experience || 'Не указан',
    'Ссылка': v.url,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Вакансии');

  // Ширина колонок
  worksheet['!cols'] = [
    { wch: 5 },  // №
    { wch: 40 }, // Название
    { wch: 25 }, // Компания
    { wch: 15 }, // Зарплата
    { wch: 20 }, // Город
    { wch: 15 }, // Источник
    { wch: 12 }, // Дата
    { wch: 15 }, // Тип занятости
    { wch: 12 }, // Опыт
    { wch: 50 }, // Ссылка
  ];

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
