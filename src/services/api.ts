import { Vacancy } from '../types';

// hh.ru API
export async function searchHeadHunter(
  keyword: string,
  areaId: number = 21 // Чебоксары
): Promise<Vacancy[]> {
  try {
    const params = new URLSearchParams({
      text: keyword,
      area: String(areaId),
      per_page: '100',
      order_by: 'publication_time',
      only_with_salary: 'false',
    });

    const response = await fetch(`https://api.hh.ru/vacancies?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`HH API returned status ${response.status} for keyword: ${keyword}`);
      return [];
    }

    const data = await response.json();
    const vacancies: Vacancy[] = (data.items || []).map((item: any) => ({
      id: `hh-${item.id}`,
      title: item.name,
      company: item.employer?.name || 'Не указано',
      salary: item.salary
        ? `${item.salary.from || ''} ${item.salary.to || ''} ${item.salary.currency || 'RUR'}`.trim()
        : undefined,
      location: item.area?.name || '',
      url: item.alternate_url || `https://hh.ru/vacancy/${item.id}`,
      source: 'hh.ru',
      datePublished: item.published_at ? new Date(item.published_at).toLocaleDateString('ru-RU') : undefined,
      description: item.snippet?.responsibility || '',
    }));

    return vacancies;
  } catch (error) {
    console.error('HH search error:', error);
    return [];
  }
}

// Работа России (trudvsem.ru) API
export async function searchTrudVsem(
  keyword: string,
  regionCode: string = '21'
): Promise<Vacancy[]> {
  try {
    const params = new URLSearchParams({
      text: keyword,
      region: regionCode,
      limit: '50',
    });

    // Try direct API first
    let response: Response;
    try {
      response = await fetch(`https://api.trudvsem.ru/api/v1/vacancies?${params}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
    } catch (corsError) {
      // If CORS error, try via proxy
      console.warn('TrudVsem direct API failed, trying proxy...');
      response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.trudvsem.ru/api/v1/vacancies?${params}`)}`);
    }

    if (!response.ok) {
      console.warn(`TrudVsem API returned status ${response.status} for keyword: ${keyword}`);
      return [];
    }

    const data = await response.json();
    const vacancies: Vacancy[] = (data?.results?.vacancies || []).map((item: any, index: number) => {
      const v = item.vacancy || item;
      return {
        id: `trud-${index}-${Date.now()}`,
        title: v.job_title || v.title || 'Не указано',
        company: v.company_name || v.employer || 'Не указано',
        salary: v.salary ? `${v.salary} руб.` : undefined,
        location: v.location_name || v.region || 'Чувашская Республика',
        url: v.vacancy_url || `https://trudvsem.ru`,
        source: 'Работа России',
        datePublished: v.creation_date ? new Date(v.creation_date).toLocaleDateString('ru-RU') : undefined,
        description: v.duties || '',
      };
    });

    return vacancies;
  } catch (error) {
    console.error('TrudVsem search error:', error);
    return [];
  }
}

// Генерация ссылок для поиска на других порталах
export function generateExternalLinks(
  keyword: string,
  city: string = 'Чебоксары'
): Vacancy[] {
  const encodedKeyword = encodeURIComponent(keyword);
  const encodedCity = encodeURIComponent(city);

  const sources = [
    {
      name: 'Авито Работа',
      url: `https://www.avito.ru/cheboksary/vakansii?q=${encodedKeyword}`,
    },
    {
      name: 'Работа.ру',
      url: `https://www.rabota.ru/vacancy/search?keywords=${encodedKeyword}&location=${encodedCity}`,
    },
    {
      name: 'SuperJob',
      url: `https://www.superjob.ru/vacancy/search/?keywords=${encodedKeyword}&town=${encodedCity}`,
    },
    {
      name: 'HeadHunter (прямой поиск)',
      url: `https://hh.ru/search/vacancy?text=${encodedKeyword}&area=21`,
    },
    {
      name: 'Работа России (прямой поиск)',
      url: `https://trudvsem.ru/search/vacancies?text=${encodedKeyword}&region=21`,
    },
    {
      name: 'Job.ru',
      url: `https://job.ru/vacancies/?text=${encodedKeyword}&region=cheboksary`,
    },
    {
      name: 'Зарплата.ру',
      url: `https://www.zarplata.ru/search/vacancy?text=${encodedKeyword}&area=cheboksary`,
    },
    {
      name: 'Indeed Россия',
      url: `https://ru.indeed.com/jobs?q=${encodedKeyword}&l=${encodedCity}`,
    },
  ];

  return sources.map((s, i) => ({
    id: `ext-${i}`,
    title: `Поиск: "${keyword}" на ${s.name}`,
    company: s.name,
    location: city,
    url: s.url,
    source: s.name,
  }));
}
