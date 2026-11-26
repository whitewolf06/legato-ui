import type { WlThemeName } from "legato-ui";
import type { PlaygroundLocale } from "../i18n/locale";

export const applicationExamples = [
  {
    id: "dashboard",
    ru: { title: "Кабинет продаж", description: "Аналитика, заказы и работа команды в одном кабинете." },
    en: { title: "Sales workspace", description: "Sales analytics, orders and team operations in one workspace." }
  },
  {
    id: "product",
    ru: { title: "Лендинг продукта", description: "Лампа «Тихий свет». Сравните яркость, изучите детали и попробуйте записаться на показ." },
    en: { title: "Product landing page", description: "Meet Quiet Light. Try the lamp's brightness settings, explore the details and book a demo viewing." }
  },
  {
    id: "chat",
    ru: { title: "Чат команды", description: "Найдите сообщение в каналах «Маяка», ответьте на него и оставьте реакцию." },
    en: { title: "Team chat", description: "Explore Beacon's team channels, search messages, send replies and react." }
  },
  {
    id: "monitoring",
    ru: { title: "SaaS-мониторинг", description: "В «Пульсе» видно, какие сервисы отвечают. Добавьте монитор или откройте инцидент." },
    en: { title: "SaaS monitoring", description: "See which services are responding in Pulse, add a monitor or investigate an incident." }
  },
  {
    id: "portfolio",
    ru: { title: "Портфолио фотографа", description: "Три серии об архитектуре и интерьерах. Откройте каждый кейс, чтобы узнать о съёмке." },
    en: { title: "Photographer portfolio", description: "Three architecture and interiors projects. Open each case study for the story behind it." }
  },
  {
    id: "mail",
    ru: { title: "Почта", description: "Разберите входящие, скачайте вложение и отправьте пробное письмо." },
    en: { title: "Mail", description: "Sort the inbox, download an attachment and send a demo email." }
  }
] as const;

const additionalExamples = [
  {
    id: "subscription",
    ru: { title: "Подписка SaaS", description: "Тарифы, места команды и счета за подписку." },
    en: { title: "SaaS subscription", description: "Plans, team seats and subscription invoices." }
  },
  {
    id: "knowledge",
    ru: { title: "База знаний", description: "Справочный центр с поиском, разделами и статьями." },
    en: { title: "Knowledge base", description: "A help center with search, topics and articles." }
  },
  {
    id: "newsletter",
    ru: { title: "Редактор рассылки", description: "Напишите выпуск, проверьте письмо на телефоне и задайте дату." },
    en: { title: "Newsletter editor", description: "Compose an issue, preview it on a phone and schedule it." }
  },
  {
    id: "booking",
    ru: { title: "Бронирование", description: "Выберите переговорную, дату и свободное время." },
    en: { title: "Room booking", description: "Choose a meeting room, date and available time." }
  }
] as const;

export type ApplicationExample = typeof applicationExamples[number] | typeof additionalExamples[number];
export type ApplicationExampleId = ApplicationExample["id"];
export type ApplicationExampleProps = { locale: PlaygroundLocale };
export type ApplicationModuleProps = ApplicationExampleProps & { embedded: boolean };

export const applicationThemeEvent = "legato:application-theme";
export const applicationLocationEvent = "legato:application-location";
export const applicationEscapeEvent = "legato:application-escape";
export const projectPreviewBase = import.meta.env.BASE_URL + "project-previews/";

export function applicationExample(id: string | null): ApplicationExample | undefined {
  return applicationExamples.find((item) => item.id === id) ?? additionalExamples.find((item) => item.id === id);
}

export function applicationExampleHref(
  id: ApplicationExampleId, locale: PlaygroundLocale, options: { theme?: WlThemeName; view?: string; order?: string } = {}
): string {
  const query = new URLSearchParams({ app: id, lang: locale });
  if (options.theme) {
    query.set("embed", "1");
    query.set("theme", options.theme);
  }
  if (options.view) query.set("view", options.view);
  if (options.order) query.set("order", options.order);
  return import.meta.env.BASE_URL + "examples/?" + query.toString();
}

export function applicationRecipesHref(locale: PlaygroundLocale): string {
  return import.meta.env.BASE_URL + (locale === "ru" ? "ru/" : "") + "docs/recipes/#recipe-applications";
}

export function projectPreviewHref(id: ApplicationExampleId, dark: boolean): string {
  return projectPreviewBase + id + (dark ? "-dark" : "") + ".webp";
}
