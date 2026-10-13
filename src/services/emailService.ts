import emailjs from '@emailjs/browser';
import { Vacancy } from '../types-pro';

// Настройте эти параметры на https://www.emailjs.com/
const SERVICE_ID = 'default_service'; // Замените на ваш Service ID
const TEMPLATE_ID = 'default_template'; // Замените на ваш Template ID
const PUBLIC_KEY = 'your_public_key'; // Замените на ваш Public Key

export async function sendReportByEmail(
  email: string,
  vacancies: Vacancy[],
  searchKeywords: string[],
  city: string
): Promise<boolean> {
  try {
    // Формируем текст письма
    const vacanciesList = vacancies.slice(0, 50).map((v, i) => 
      `${i + 1}. ${v.title}\n   Компания: ${v.company}\n   Зарплата: ${v.salary || 'Не указана'}\n   Ссылка: ${v.url}\n`
    ).join('\n');

    const templateParams = {
      to_email: email,
      subject: `Подбор вакансий - ${city} - ${new Date().toLocaleDateString('ru-RU')}`,
      message: `Здравствуйте!\n\nНаправляю вам подборку актуальных вакансий.\n\nГород: ${city}\nДата: ${new Date().toLocaleDateString('ru-RU')}\nВсего найдено: ${vacancies.length} вакансий\n\nКлючевые запросы:\n${searchKeywords.map(k => `• ${k}`).join('\n')}\n\n=== ВАКАНСИИ ===\n\n${vacanciesList}\n\n=== КОНЕЦ ===\n\nС уважением,\nКарьерный консультант`,
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    // Fallback: открываем mailto
    const subject = encodeURIComponent(`Подбор вакансий - ${city}`);
    const body = encodeURIComponent(
      `Всего найдено: ${vacancies.length} вакансий\n\n` +
      vacancies.slice(0, 20).map((v, i) => 
        `${i + 1}. ${v.title} - ${v.company}\n   ${v.url}`
      ).join('\n\n')
    );
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    return false;
  }
}

export function openMailClient(
  email: string,
  vacancies: Vacancy[],
  city: string
): void {
  const subject = encodeURIComponent(`Подбор вакансий - ${city} - ${new Date().toLocaleDateString('ru-RU')}`);
  const body = encodeURIComponent(
    `Здравствуйте!\n\nНаправляю вам подборку актуальных вакансий.\n\n` +
    `Город: ${city}\nДата: ${new Date().toLocaleDateString('ru-RU')}\n` +
    `Всего найдено: ${vacancies.length} вакансий\n\n` +
    vacancies.slice(0, 30).map((v, i) => 
      `${i + 1}. ${v.title}\n   Компания: ${v.company}\n   Зарплата: ${v.salary || 'Не указана'}\n   Ссылка: ${v.url}\n`
    ).join('\n')
  );

  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}
