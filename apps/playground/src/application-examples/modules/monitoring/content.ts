export type MonitorStatus = "up" | "down" | "paused" | "pending";

export interface Monitor {
  id: string;
  label: string;
  url: string;
  cadence: number;
  samples: (number | null)[];
  paused: boolean;
}

const monitors = [
  { id: "store", ru: "Витрина магазина", en: "Storefront", url: "https://north.example/", base: 154, cadence: 1 },
  { id: "checkout", ru: "Оплата", en: "Checkout", url: "https://north.example/checkout/health", base: 220, cadence: 1 },
  { id: "help", ru: "Справочный центр", en: "Help center", url: "https://support.north.example/", base: 116, cadence: 5 },
  { id: "inventory", ru: "Остатки на складе", en: "Warehouse inventory", url: "https://stock.north.example/health", base: 113, cadence: 5 },
  { id: "sandbox", ru: "Тестовый магазин", en: "Staging store", url: "https://staging.north.example/", base: 182, cadence: 15 }
] as const;

const jitter = [0, 30, 13, 45, 22, -18, -6, 37, 9, 33, 27, -8, 4, 58, 40, 81, 22, 11, 0, 35, 8, 14, 5, -2];
export function createMonitors(locale: "ru" | "en"): Monitor[] {
  return monitors.map((monitor) => ({
    id: monitor.id, label: monitor[locale], url: monitor.url, cadence: monitor.cadence,
    paused: monitor.id === "sandbox",
    samples: jitter.map((value, index) => monitor.id === "checkout" && index >= 21 ? null : monitor.base + value)
  }));
}

export const monitoringCopy = {
  ru: {
    brand: "Пульс", workspace: "Интернет-магазин «Север»", title: "Доступность сервисов",
    intro: "Ответы витрины, оплаты и складского API в одном месте.",
    add: "Добавить монитор", back: "К примерам", monitors: "Мониторы", incidents: "Инциденты", plan: "Тариф",
    issues: "Одна проверка требует внимания", noIssues: "Нет проверок с ошибкой",
    running: (count: number, total: number) => "Успешный ответ у " + count + " из " + total + " мониторов",
    all: "Все", attention: "С ошибкой", filter: "Фильтр мониторов",
    status: { up: "Работает", down: "Ошибка", paused: "На паузе", pending: "Ожидает" },
    every: (value: number) => value === 1 ? "Раз в минуту" : "Раз в " + value + " мин",
    pause: "Приостановить", resume: "Возобновить", checkHistory: "Последние проверки", oldest: "Раньше", latest: "Сейчас",
    samples: (done: number, total: number) => "Успешных проверок " + done + " из " + total,
    lastCheck: "Последний ответ", timeout: "Ответ не получен", ms: "мс",
    noChecks: "У нового монитора пока нет истории проверок.",
    activeIncident: "Оплата не отвечает", incidentLead: "Три проверки подряд без ответа от сервиса оплаты.",
    timeline: [["14:28", "Проверка не дождалась ответа."], ["14:29", "Ошибка повторилась."], ["14:30", "Открыт инцидент и добавлен в список команды."]],
    open: "Открыт", acknowledged: "В работе", acknowledge: "Взять в работу",
    closedIncident: "Складской API отвечал медленно", resolved: "Решён",
    closedDescription: "После перезапуска очереди время ответа вернулось в обычный диапазон. Окно сбоя — с 09:15 до 09:27.",
    teamPlan: "Тариф «Команда»", planLead: "До 12 мониторов с проверками раз в минуту и историей за 90 дней.",
    use: "Места под мониторы", renew: "Период подписки до 1 декабря.",
    name: "Название", url: "Адрес проверки", interval: "Интервал", save: "Сохранить монитор",
    demoHint: "Монитор появится в этом окне. Демонстрация не отправляет запросы на указанный адрес.",
    invalidUrl: "Введите адрес, который начинается с http:// или https://.",
    duplicate: "Этот адрес уже есть в списке.",
    added: "Монитор добавлен.", pauseFeedback: "Проверки поставлены на паузу.", resumeFeedback: "Проверки возобновлены."
  },
  en: {
    brand: "Pulse", workspace: "North online store", title: "Service availability",
    intro: "Monitor the storefront, checkout and inventory API in one place.",
    add: "Add monitor", back: "Back to examples", monitors: "Monitors", incidents: "Incidents", plan: "Plan",
    issues: "One check needs attention", noIssues: "No failing checks",
    running: (count: number, total: number) => count + " of " + total + " monitors responding successfully",
    all: "All", attention: "Failing", filter: "Filter monitors",
    status: { up: "Operational", down: "Failing", paused: "Paused", pending: "Pending" },
    every: (value: number) => value === 1 ? "Every minute" : "Every " + value + " min",
    pause: "Pause", resume: "Resume", checkHistory: "Recent checks", oldest: "Earlier", latest: "Now",
    samples: (done: number, total: number) => done + " of " + total + " checks passed",
    lastCheck: "Last response", timeout: "No response", ms: "ms",
    noChecks: "The new monitor has no check history yet.",
    activeIncident: "Checkout is not responding", incidentLead: "The checkout service missed three checks in a row.",
    timeline: [["14:28", "The check timed out."], ["14:29", "The next check also timed out."], ["14:30", "The incident was opened for the team."]],
    open: "Open", acknowledged: "Investigating", acknowledge: "Start investigating",
    closedIncident: "Inventory API was slow", resolved: "Resolved",
    closedDescription: "Response time returned to normal after a queue restart. The disruption lasted from 09:15 to 09:27.",
    teamPlan: "Team plan", planLead: "Up to 12 monitors with one-minute checks and 90 days of history.",
    use: "Monitor usage", renew: "The current billing period ends on December 1.",
    name: "Name", url: "Check URL", interval: "Interval", save: "Save monitor",
    demoHint: "The monitor is added to this window. The demo sends no requests to the address.",
    invalidUrl: "Enter an address that starts with http:// or https://.",
    duplicate: "This address is already monitored.",
    added: "Monitor added.", pauseFeedback: "Checks paused.", resumeFeedback: "Checks resumed."
  }
} as const;
