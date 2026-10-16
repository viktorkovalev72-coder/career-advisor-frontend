// Yandex Speller API для проверки орфографии
export async function checkSpelling(text: string): Promise<string> {
  try {
    const response = await fetch(
      `https://speller.yandex.net/services/spellservice.json/checkText?text=${encodeURIComponent(text)}&lang=ru`
    );
    const corrections = await response.json();
    
    let correctedText = text;
    
    // Применяем исправления в обратном порядке (чтобы не сбить позиции)
    corrections.sort((a, b) => b.pos - a.pos);
    
    for (const correction of corrections) {
      const wrongWord = correctedText.substring(correction.pos, correction.pos + correction.len);
      const correctWord = correction.suggest[0];
      correctedText = correctedText.substring(0, correction.pos) + correctWord + correctedText.substring(correction.pos + correction.len);
    }
    
    return correctedText;
  } catch (error) {
    console.error('Spelling check error:', error);
    return text;
  }
}

// Получение подсказок от hh.ru API
export async function getJobTitleSuggestions(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.hh.ru/suggests/areas?text=${encodeURIComponent(query)}&area=113`
    );
    const data = await response.json();
    
    if (data.items && Array.isArray(data.items)) {
      return data.items.slice(0, 10).map((item: any) => item.text);
    }
    
    return [];
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

// Альтернатива: поиск по вакансиям hh.ru для подсказок
export async function getVacancySuggestions(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.hh.ru/vacancies?text=${encodeURIComponent(query)}&area=113&per_page=10`
    );
    const data = await response.json();
    
    if (data.items && Array.isArray(data.items)) {
      // Извлекаем уникальные названия должностей
      const titles = new Set<string>();
      data.items.forEach((item: any) => {
        if (item.name) {
          titles.add(item.name);
        }
      });
      return Array.from(titles).slice(0, 10);
    }
    
    return [];
  } catch (error) {
    console.error('Vacancy suggestions error:', error);
    return [];
  }
}

// Локальный словарь популярных должностей
const POPULAR_JOB_TITLES = [
  'начальник службы безопасности',
  'руководитель отдела безопасности',
  'специалист по безопасности',
  'инженер по безопасности',
  'менеджер по безопасности',
  'охранник',
  'водитель',
  'менеджер',
  'бухгалтер',
  'программист',
  'дизайнер',
  'маркетолог',
  'продавец',
  'консультант',
  'администратор',
  'директор',
  'заместитель директора',
  'главный инженер',
  'начальник отдела',
  'руководитель проекта',
  'аналитик',
  'юрист',
  'HR-менеджер',
  'логист',
  'кладовщик',
  'грузчик',
  'курьер',
  'повар',
  'учитель',
  'врач',
  'медсестра',
  'строитель',
  'электрик',
  'сантехник',
  'механик',
  'оператор',
  'сварщик',
  'токарь',
  'фрезеровщик',
  'слесарь',
];

// Поиск по локальному словарю
export function searchLocalDictionary(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return POPULAR_JOB_TITLES
    .filter(title => title.toLowerCase().includes(lowerQuery))
    .slice(0, 10);
}

// Комплексная функция подсказок
export async function getSmartSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }
  
  try {
    // Параллельно запрашиваем подсказки из разных источников
    const [localSuggestions, hhSuggestions] = await Promise.all([
      Promise.resolve(searchLocalDictionary(query)),
      getVacancySuggestions(query).catch(() => []),
    ]);
    
    // Объединяем и удаляем дубликаты
    const allSuggestions = new Set<string>([
      ...localSuggestions,
      ...hhSuggestions,
    ]);
    
    return Array.from(allSuggestions).slice(0, 10);
  } catch (error) {
    console.error('Smart suggestions error:', error);
    return searchLocalDictionary(query);
  }
}
