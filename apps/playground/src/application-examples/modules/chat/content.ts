export const people = {
  you: { ru: "Кира Новикова", en: "Kira Novikova" },
  mira: { ru: "Мира Волкова", en: "Mira Volkova" },
  dan: { ru: "Данил Левин", en: "Dan Levin" },
  olya: { ru: "Ольга Соколова", en: "Olga Sokolova" }
} as const;

export const rooms = [
  {
    id: "studio", icon: "comments",
    ru: { title: "Студия", description: "Рабочие вопросы команды из четырёх человек" },
    en: { title: "Studio", description: "The workspace for our team of four" }
  },
  {
    id: "launch", icon: "lightning",
    ru: { title: "Запуск сайта", description: "Тексты, макеты и проверка перед запуском" },
    en: { title: "Website launch", description: "Copy, designs and pre-launch checks" }
  },
  {
    id: "ideas", icon: "lightbulb",
    ru: { title: "Идеи", description: "То, что хочется попробовать в следующем проекте" },
    en: { title: "Ideas", description: "Things to try in our next project" }
  },
  {
    id: "mira", person: "mira",
    ru: { title: people.mira.ru, description: "Личные сообщения" },
    en: { title: people.mira.en, description: "Direct messages" }
  },
  {
    id: "dan", person: "dan",
    ru: { title: people.dan.ru, description: "Личные сообщения" },
    en: { title: people.dan.en, description: "Direct messages" }
  }
] as const;

export type RoomId = typeof rooms[number]["id"];
export interface ChatMessage {
  id: number;
  room: RoomId;
  by: keyof typeof people;
  time: string;
  text: string;
  reactions?: number;
  liked?: boolean;
  reply?: number;
}

const history = [
  {
    room: "studio", by: "mira", time: "10:04", reactions: 2,
    ru: "Доброе утро! Собрала замечания после вчерашнего просмотра. Сегодня хочу закрыть мобильную версию и показать, как выглядит страница с длинными текстами.",
    en: "Morning! I pulled together the notes from yesterday’s review. Today I want to finish the mobile layout and show how it handles longer copy."
  },
  {
    room: "studio", by: "dan", time: "10:12", reactions: 1,
    ru: "Проверю меню на 320 и 390 пикселях. Ещё посмотрю, удобно ли переходить между разделами только с клавиатуры.",
    en: "I’ll check the menu at 320 and 390 pixels and try moving between sections with just the keyboard."
  },
  {
    room: "studio", by: "olya", time: "10:19",
    ru: "Я принесу на созвон два варианта короткого описания. Подскажите, если нужен ещё текст для карточки при пересылке.",
    en: "I’ll bring two versions of the short description to the call. Let me know if you need copy for the share card too."
  },
  {
    room: "studio", by: "mira", time: "10:24", reply: 3,
    ru: "Да, давай заодно посмотрим карточку. Тогда решим, какой заголовок использовать и на странице, и в превью.",
    en: "Yes, let’s look at the share card as well. We can settle on a heading for the page and the preview together."
  },
  {
    room: "launch", by: "dan", time: "09:40",
    ru: "Сборка готова. Осталась проверка прямых ссылок на разделы после перезагрузки страницы.",
    en: "The build is ready. We still need to check that deep links work after reloading the page."
  },
  {
    room: "launch", by: "mira", time: "09:52",
    ru: "Начну с первого экрана и формы. Если увижу сдвиг, напишу ширину экрана и браузер.",
    en: "I’ll start with the hero and the form. If anything shifts, I’ll note the viewport and browser."
  },
  {
    room: "ideas", by: "olya", time: "11:10",
    ru: "Хочу попробовать собирать примеры из реальных задач недели. Так будет проще выбрать, какие сценарии показывать.",
    en: "I’d like to build examples around actual tasks from the week. That should make it easier to pick which scenarios to show."
  },
  {
    room: "mira", by: "mira", time: "11:24",
    ru: "Кира, покажешь правки до общего просмотра? Хочу сверить порядок блоков.",
    en: "Kira, could you show me your edits before the team review? I’d like to check the order of the sections."
  },
  {
    room: "mira", by: "you", time: "11:30",
    ru: "Да, соберу к обеду. Начнём с формы и короткого описания.",
    en: "Yes, I’ll have them by lunch. Let’s start with the form and short description."
  },
  {
    room: "dan", by: "dan", time: "12:00",
    ru: "Проверил ссылки с телефона. Смогу ещё посмотреть на планшете после обеда.",
    en: "I checked the links on my phone. I can take a look on a tablet after lunch as well."
  }
] as const;

const messages = (locale: "ru" | "en"): ChatMessage[] => history.map((message, index) => ({
  id: index + 1, room: message.room, by: message.by, time: message.time, text: message[locale],
  ...("reactions" in message ? { reactions: message.reactions } : {}),
  ...("reply" in message ? { reply: message.reply } : {})
}));

export const chatCopy = {
  ru: {
    brand: "Маяк", workspace: "Команда «Контур»", rooms: "Список чатов", channels: "Каналы", direct: "Личные",
    pinned: "Просмотр в 15:00.", pinText: "Приносите вопросы по макетам и то, что нужно решить вместе.",
    unread: "непрочитанных", search: "Поиск в чате", noResults: "Сообщения не найдены.",
    react: "Отметить реакцией", reply: "Ответить", replyTo: "Ответ для", cancelReply: "Отменить ответ",
    message: "Написать сообщение", send: "Отправить", back: "К примерам", messages: messages("ru")
  },
  en: {
    brand: "Beacon", workspace: "Contour team", rooms: "Chat list", channels: "Channels", direct: "Direct",
    pinned: "Review at 15:00.", pinText: "Bring design questions and anything we need to decide together.",
    unread: "unread", search: "Search this chat", noResults: "No messages found.",
    react: "React to message", reply: "Reply", replyTo: "Replying to", cancelReply: "Cancel reply",
    message: "Write a message", send: "Send", back: "Back to examples", messages: messages("en")
  }
} as const;
