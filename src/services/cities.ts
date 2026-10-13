import { City } from '../types-pro';

export const CITIES: City[] = [
  // Приволжский федеральный округ
  // hhId - это ID города в hh.ru API (не региона!)
  { name: 'Чебоксары', hhId: 107, trudCode: '21' },
  { name: 'Казань', hhId: 88, trudCode: '16' },
  { name: 'Нижний Новгород', hhId: 66, trudCode: '52' },
  { name: 'Самара', hhId: 78, trudCode: '63' },
  { name: 'Уфа', hhId: 99, trudCode: '02' },
  { name: 'Пермь', hhId: 69, trudCode: '59' },
  { name: 'Саратов', hhId: 76, trudCode: '64' },
  { name: 'Оренбург', hhId: 72, trudCode: '56' },
  { name: 'Пенза', hhId: 68, trudCode: '58' },
  { name: 'Киров', hhId: 52, trudCode: '43' },
  { name: 'Ульяновск', hhId: 93, trudCode: '73' },
  { name: 'Ижевск', hhId: 40, trudCode: '18' },
  { name: 'Йошкар-Ола', hhId: 43, trudCode: '12' },
  { name: 'Саранск', hhId: 65, trudCode: '13' },
];

export const EMPLOYMENT_TYPES = [
  { id: 'full', name: 'Полная занятость' },
  { id: 'part', name: 'Частичная занятость' },
  { id: 'remote', name: 'Удалённая работа' },
  { id: 'shift', name: 'Вахтовый метод' },
  { id: 'internship', name: 'Стажировка' },
];

export const EXPERIENCE_LEVELS = [
  { id: 'noExperience', name: 'Без опыта' },
  { id: 'between1And3', name: '1-3 года' },
  { id: 'between3And6', name: '3-6 лет' },
  { id: 'moreThan6', name: 'Более 6 лет' },
];
