import type { Vacancy, SearchFilters } from '../types-pro';

export function generatePDF(vacancies: Vacancy[], filters: SearchFilters): void {
  console.log('[PDF] Генерация PDF, вакансий:', vacancies.length);

  try {
    const grouped: Record<string, Vacancy[]> = {};
    vacancies.forEach(v => {
      if (!grouped[v.source]) grouped[v.source] = [];
      grouped[v.source].push(v);
    });

    const filtersInfo = [];
    if (filters.salaryFrom) filtersInfo.push(`от ${filters.salaryFrom} ₽`);
    if (filters.salaryTo) filtersInfo.push(`до ${filters.salaryTo} ₽`);
    if (filters.employment && filters.employment.length > 0) filtersInfo.push(`Тип: ${filters.employment.join(', ')}`);
    if (filters.dateFrom) filtersInfo.push(`С даты: ${filters.dateFrom}`);

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Подбор вакансий PRO — ${new Date().toLocaleDateString('ru-RU')}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    margin: 0;
    padding: 15mm;
    color: #333;
    line-height: 1.5;
    font-size: 11pt;
  }
  h1 { color: #003366; border-bottom: 3px solid #003366; padding-bottom: 8px; margin: 0 0 5px 0; font-size: 20pt; }
  .subtitle { color: #666; font-size: 10pt; margin-bottom: 15px; }
  .info-box { background: #f0f5ff; padding: 12px 15px; border-radius: 6px; margin-bottom: 10px; font-size: 10pt; }
  .filters-box { background: #fff3e0; padding: 12px 15px; border-radius: 6px; margin-bottom: 10px; font-size: 9pt; }
  .keywords-box { background: #e8f5e9; padding: 12px 15px; border-radius: 6px; margin-bottom: 15px; font-size: 9pt; }
  .keywords-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
  .keyword-tag { background: #fff; padding: 2px 8px; border-radius: 4px; border: 1px solid #a5d6a7; font-size: 8pt; }
  h2 { color: #003366; border-left: 4px solid #003366; padding-left: 10px; margin: 20px 0 10px 0; font-size: 13pt; page-break-after: avoid; }
  .vacancy { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; page-break-inside: avoid; }
  .vacancy-title { font-weight: bold; color: #003366; font-size: 10pt; margin-bottom: 3px; }
  .vacancy-meta { color: #666; font-size: 9pt; margin-bottom: 2px; }
  .vacancy-salary { color: #2e7d32; font-size: 9pt; font-weight: bold; }
  .vacancy-link { color: #0066cc; font-size: 8pt; word-break: break-all; text-decoration: none; }
  .analytics-box { background: #e3f2fd; padding: 12px 15px; border-radius: 6px; margin-top: 20px; font-size: 10pt; }
  .analytics-box h3 { margin: 0 0 8px 0; color: #1565c0; }
  .summary-box { background: #f3e5f5; padding: 12px 15px; border-radius: 6px; margin-top: 15px; font-size: 10pt; }
  .summary-box h3 { margin: 0 0 8px 0; color: #7b1fa2; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; color: #999; font-size: 8pt; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
  .print-banner { background: #e3f2fd; border: 2px solid #2196f3; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
  .print-banner button { background: #2196f3; color: white; border: none; padding: 10px 25px; border-radius: 6px; font-size: 12pt; cursor: pointer; margin-top: 10px; }
  .print-banner button:hover { background: #1976d2; }
  .fav-star { color: #ffc107; }
</style>
</head>
<body>

<div class="print-banner no-print">
  <strong>📄 PDF готов к сохранению!</strong><br>
  Нажмите кнопку ниже или <kbd>Ctrl+P</kbd> для сохранения как PDF
  <br>
  <button onclick="window.print()">💾 Сохранить как PDF</button>
</div>

<h1>📋 Подбор вакансий PRO</h1>
<p class="subtitle">Профессиональный карьерный консультант • Расширенный поиск</p>

<div class="info-box">
  <strong>📅 Дата формирования:</strong> ${new Date().toLocaleString('ru-RU')}<br>
  <strong>📍 Город:</strong> ${filters.city}<br>
  <strong>📊 Всего найдено вакансий:</strong> ${vacancies.length}
</div>

${filtersInfo.length > 0 ? `
<div class="filters-box">
  <strong>⚙️ Применённые фильтры:</strong><br>
  ${filtersInfo.join(' • ')}
</div>
` : ''}

<div class="keywords-box">
  <strong>🔍 Ключевые запросы (${filters.keywords.length}):</strong>
  <div class="keywords-list">
    ${filters.keywords.map((kw, i) => `<span class="keyword-tag">${i + 1}. ${kw}</span>`).join('')}
  </div>
</div>

${Object.entries(grouped).map(([source, items]) => `
  <h2>${source} (${items.length} вакансий)</h2>
  ${items.map((v, i) => `
    <div class="vacancy">
      <div class="vacancy-title">${v.isFavorite ? '<span class="fav-star">⭐</span> ' : ''}${i + 1}. ${v.title}</div>
      ${v.company ? `<div class="vacancy-meta">🏢 ${v.company}</div>` : ''}
      ${v.salary ? `<div class="vacancy-salary">💰 ${v.salary}</div>` : ''}
      ${v.employment ? `<div class="vacancy-meta">💼 ${v.employment}</div>` : ''}
      ${v.experience ? `<div class="vacancy-meta">📊 Опыт: ${v.experience}</div>` : ''}
      ${v.datePublished ? `<div class="vacancy-meta">📅 ${v.datePublished}</div>` : ''}
      <div>
        <a href="${v.url}" target="_blank" class="vacancy-link">🔗 ${v.url}</a>
      </div>
    </div>
  `).join('')}
`).join('')}

<div class="summary-box">
  <h3>📈 Сводная информация</h3>
  <p><strong>Всего вакансий:</strong> ${vacancies.length}</p>
  <p><strong>По источникам:</strong></p>
  <ul>
    ${Object.entries(grouped).map(([source, items]) => `<li>${source}: ${items.length}</li>`).join('')}
  </ul>
</div>

<div class="footer">
  Сформировано: ${new Date().toLocaleString('ru-RU')} | Карьерный консультант PRO
</div>

</body>
</html>`;

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Разрешите всплывающие окна для этого сайта!');
      return;
    }

    newWindow.document.write(html);
    newWindow.document.close();
    console.log('[PDF] Документ открыт в новой вкладке');
  } catch (error) {
    console.error('[PDF] ОШИБКА:', error);
    alert('Ошибка: ' + (error as Error).message);
  }
}
