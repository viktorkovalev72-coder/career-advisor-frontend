import { Vacancy, SearchFilters } from '../types-pro';

// URL сервера - облачный сервер на Render.com
const API_URL = 'https://career-advisor-prsj.onrender.com';

console.log(`[API] Сервер: ${API_URL}`);

// Комплексный поиск через сервер
export async function searchAll(filters: SearchFilters): Promise<Vacancy[]> {
  try {
    console.log('[API] Отправка запроса на сервер...');
    console.log('[API] Фильтры:', filters);
    
    const response = await fetch(`${API_URL}/api/search`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: filters.keywords,
        cityId: filters.cityId || 113,
        regionCode: filters.regionCode || '',
        salaryFrom: filters.salaryFrom,
        salaryTo: filters.salaryTo,
        employment: filters.employment,
        experience: filters.experience,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Получено вакансий: ${data.total}`);
    
    if (!data.success) {
      throw new Error(data.error || 'Ошибка поиска');
    }
    
    return data.vacancies || [];
  } catch (error) {
    console.error('[API] Ошибка:', error);
    throw error;
  }
}

// Проверка работоспособности сервера
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    console.log('[API] Сервер работает:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('[API] Сервер недоступен:', error);
    return false;
  }
}

// Поиск на hh.ru напрямую (для тестирования)
export async function searchHeadHunter(filters: SearchFilters): Promise<Vacancy[]> {
  try {
    const params = new URLSearchParams({
      text: filters.keywords[0] || '',
      area: String(filters.cityId || 113),
      per_page: '100',
      page: '0',
    });

    const response = await fetch(`${API_URL}/api/hh/vacancies?${params}`);
    const data = await response.json();
    
    return (data.items || []).map((item: any) => ({
      id: `hh-${item.id}`,
      title: item.name,
      company: item.employer?.name || 'Не указано',
      salary: item.salary
        ? `${item.salary.from || ''} ${item.salary.to || ''} ${item.salary.currency || 'RUR'}`.trim()
        : undefined,
      salaryFrom: item.salary?.from,
      salaryTo: item.salary?.to,
      location: item.area?.name || '',
      url: item.alternate_url || `https://hh.ru/vacancy/${item.id}`,
      source: 'hh.ru',
      datePublished: item.published_at ? new Date(item.published_at).toLocaleDateString('ru-RU') : undefined,
      description: item.snippet?.responsibility || '',
      employment: item.employment?.name || '',
      experience: item.experience?.name || '',
    }));
  } catch (error) {
    console.error('[API] HH error:', error);
    return [];
  }
}

// Поиск на trudvsem напрямую (для тестирования)
export async function searchTrudVsem(filters: SearchFilters): Promise<Vacancy[]> {
  try {
    const params = new URLSearchParams({
      text: filters.keywords[0] || '',
      region: filters.regionCode || '',
      limit: '50',
    });

    const response = await fetch(`${API_URL}/api/trudvsem/vacancies?${params}`);
    const data = await response.json();
    
    return (data?.results?.vacancies || []).map((item: any, index: number) => {
      const v = item.vacancy || item;
      return {
        id: `trud-${index}-${Date.now()}`,
        title: v.job_title || v.title || 'Не указано',
        company: v.company_name || v.employer || 'Не указано',
        salary: v.salary ? `${v.salary} руб.` : undefined,
        salaryFrom: v.salary ? parseInt(v.salary) : undefined,
        location: v.location_name || v.region || 'Россия',
        url: v.vacancy_url || 'https://trudvsem.ru',
        source: 'Работа России',
        datePublished: v.creation_date ? new Date(v.creation_date).toLocaleDateString('ru-RU') : undefined,
        description: v.duties || '',
        employment: v.employment || '',
      };
    });
  } catch (error) {
    console.error('[API] TrudVsem error:', error);
    return [];
  }
}

// Генерация внешних ссылок
export function generateExternalLinks(filters: SearchFilters): Vacancy[] {
  const city = filters.city || 'Чебоксары';
  const cityId = filters.cityId || 21;
  const regionCode = filters.regionCode || '21';
  
  // Маппинг городов для транслита
  const cityTranslit: Record<string, string> = {
    'Чебоксары': 'cheboksary',
    'Казань': 'kazan',
    'Нижний Новгород': 'nizhniy_novgorod',
    'Самара': 'samara',
    'Уфа': 'ufa',
    'Пермь': 'perm',
    'Саратов': 'saratov',
    'Оренбург': 'orenburg',
    'Пенза': 'penza',
    'Киров': 'kirov',
    'Ульяновск': 'ulyanovsk',
    'Ижевск': 'izhevsk',
    'Йошкар-Ола': 'yoshkar-ola',
    'Саранск': 'saransk',
  };
  
  // Маппинг городов для поддоменов
  const citySubdomain: Record<string, string> = {
    'Чебоксары': 'cheb',
    'Казань': 'kazan',
    'Нижний Новгород': 'nn',
    'Самара': 'samara',
    'Уфа': 'ufa',
    'Пермь': 'perm',
    'Саратов': 'saratov',
    'Оренбург': 'orenburg',
    'Пенза': 'penza',
    'Киров': 'kirov',
    'Ульяновск': 'ulyanovsk',
    'Ижевск': 'izhevsk',
    'Йошкар-Ола': 'yoshkar-ola',
    'Саранск': 'saransk',
  };
  
  // Маппинг регионов для Работа России
  const regionIds: Record<string, string> = {
    'Чувашская Республика': '2100000000000',
    'Республика Татарстан': '1600000000000',
    'Нижегородская область': '5200000000000',
    'Самарская область': '6300000000000',
    'Республика Башкортостан': '0200000000000',
    'Пермский край': '5900000000000',
    'Саратовская область': '6400000000000',
    'Оренбургская область': '5600000000000',
    'Пензенская область': '5800000000000',
    'Кировская область': '4300000000000',
    'Ульяновская область': '7300000000000',
    'Удмуртская Республика': '1800000000000',
    'Республика Марий Эл': '1200000000000',
    'Республика Мордовия': '1300000000000',
  };
  
  const allLinks: Vacancy[] = [];
  let counter = 0;

  // Функция транслитерации кириллицы в латиницу
  const transliterate = (text: string): string => {
    const map: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      ' ': '_', '-': '_', '_': '_'
    };
    return text.toLowerCase().split('').map(char => map[char] || char).join('')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  for (const keyword of filters.keywords) {
    const encodedKeyword = encodeURIComponent(keyword);
    const keywordTranslit = transliterate(keyword);
    
    const cityTranslitName = cityTranslit[city] || city.toLowerCase().replace(/\s+/g, '_');
    const citySubdomainName = citySubdomain[city] || city.toLowerCase().replace(/\s+/g, '-');
    const regionId = regionIds[city] || '2100000000000';

    const sources = [
      // Авито - работает!
      { 
        name: 'Авито Работа', 
        url: `https://www.avito.ru/${cityTranslitName}/vakansii?q=${encodedKeyword}` 
      },
      
      // Работа.ру - использует поддомен города
      { 
        name: 'Работа.ру', 
        url: `https://${citySubdomainName}.rabota.ru/vacancy/${encodedKeyword}/` 
      },
      
      // SuperJob - использует поддомен города и поиск
      { 
        name: 'SuperJob', 
        url: `https://${cityTranslitName}.superjob.ru/vacancy/search/?keywords=${encodedKeyword}` 
      },
      
      // HeadHunter - использует area ID города (107 для Чебоксар, не 21!)
      { 
        name: 'HeadHunter', 
        url: `https://hh.ru/search/vacancy?text=${encodedKeyword}&area=${cityId}&only_with_salary=false` 
      },
      
      // Работа России - использует ID региона (к сожалению, фильтрация только по региону, не по городу)
      // Для Чувашской Республики: 2100000000000
      { 
        name: 'Работа России', 
        url: `https://trudvsem.ru/vacancy/search?_title=${encodedKeyword}&_regionIds=${regionCode}00000000000` 
      },
      
      // Зарплата.ру - использует поддомен города и транслит должности в пути
      { 
        name: 'Зарплата.ру', 
        url: `https://${cityTranslitName}.zarplata.ru/vacancies/${keywordTranslit}` 
      },
    ];

    sources.forEach(s => {
      allLinks.push({
        id: `ext-${counter++}`,
        title: `Поиск: "${keyword}" на ${s.name}`,
        company: s.name,
        location: city,
        url: s.url,
        source: s.name,
      });
    });
  }

  return allLinks;
}
