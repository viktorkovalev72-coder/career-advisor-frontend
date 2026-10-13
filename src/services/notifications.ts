export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Браузер не поддерживает уведомления');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function showNotification(title: string, body: string): void {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

export function notifyNewVacancies(count: number): void {
  showNotification(
    '🎉 Найдены новые вакансии!',
    `Обнаружено ${count} новых вакансий по вашему запросу`
  );
}

export function notifySearchComplete(total: number): void {
  showNotification(
    '✅ Поиск завершён',
    `Всего найдено ${total} вакансий`
  );
}
