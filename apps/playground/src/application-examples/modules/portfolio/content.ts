import clay from "./clay-studio.webp";
import dune from "./dune-house.webp";
import hall from "./open-hall.webp";

export type ProjectType = "architecture" | "interiors";

export const portfolioProjects = [
  {
    id: "hall", type: "architecture", year: 2026, image: hall,
    ru: {
      title: "Открытый зал", location: "Санкт-Петербург", alt: "Читальный зал с дубовыми столами в бывшем заводском корпусе",
      brief: "Из бывшего заводского корпуса сделали читальный зал. Для публикации нужно было показать и старый каркас здания, и то, как библиотекой пользуются сейчас.",
      approach: "Я снимала в два захода. Утром боковой свет подчёркивал бетон, днём посетители за длинным столом помогли передать масштаб зала."
    },
    en: {
      title: "Open Hall", location: "Saint Petersburg", alt: "An oak reading table in a library housed in a former factory",
      brief: "A former factory became a public reading room. The feature needed to show both the original structure and the ways people use the library today.",
      approach: "I shot in two sessions. Side light picked out the concrete in the morning, and readers at the long table gave the hall a sense of scale in the afternoon."
    }
  },
  {
    id: "dune", type: "architecture", year: 2025, image: dune,
    ru: {
      title: "Дом у дюн", location: "Куршская коса", alt: "Дом с фасадом из тёмного дерева среди прибрежных дюн",
      brief: "Невысокий деревянный дом стоит на границе дюн и соснового леса. Задача серии — показать, как он вписан в рельеф.",
      approach: "На пасмурном берегу хорошо читаются и тёмный фасад, и сухая трава. Я начала с вида с тропы, по которой к дому подходят гости."
    },
    en: {
      title: "House at the Dunes", location: "Curonian Spit", alt: "A low, dark timber house in coastal dunes",
      brief: "A low wooden house stands between the dunes and the pines. The series shows how it sits in the landscape.",
      approach: "An overcast sky brought out the dark cladding and dry grass at the same time. I began with the path guests use to approach the house."
    }
  },
  {
    id: "studio", type: "interiors", year: 2025, image: clay,
    ru: {
      title: "Глина и свет", location: "Выборг", alt: "Керамическая мастерская с верстаком и полками с посудой",
      brief: "Керамистам понадобилась серия для сайта мастерской. В кадре должны были остаться рабочий стол, образцы глины и вещи, которыми пользуются каждый день.",
      approach: "Начали с общего плана от входа. Потом я сняла руки за верстаком и фактуру изделий у окна, где свет мягче."
    },
    en: {
      title: "Clay and Light", location: "Vyborg", alt: "A ceramics studio with a workbench and shelves of bowls",
      brief: "The ceramicists needed photographs for their studio site. The workbench, clay samples and the tools they use every day all belonged in the frame.",
      approach: "We started with an overview from the doorway, then moved to hands at work and the texture of the pieces in softer window light."
    }
  }
] as const;

export const portfolioCopy = {
  ru: {
    name: "Анна Лесная", genre: "Архитектурный фотограф", title: "Места, в которых есть жизнь",
    lead: "Снимаю здания и интерьеры для архитектурных бюро, мастерских и редакций. Начинаю со света и того, как люди пользуются пространством.",
    navigation: "Портфолио", work: "Работы", about: "Подход", contact: "Контакты", seeWork: "Смотреть работы",
    back: "К примерам", top: "Наверх",
    workTitle: "Избранные работы", filter: "Тип проекта", all: "Все", architecture: "Архитектура", interiors: "Интерьеры",
    aboutTitle: "Как проходит съёмка", aboutLead: "Сначала обсуждаем, где будут опубликованы фотографии. Это помогает выбрать и время съёмки, и нужные планы.",
    process: [
      { title: "Разбираемся в задаче", description: "Смотрю планы и референсы, узнаю, какие помещения и детали важно снять." },
      { title: "Выбираем время", description: "Сверяю свет на месте. Для фасада и интерьера иногда нужны разные часы." },
      { title: "Собираем серию", description: "Подбираю общие планы и детали, готовлю кадры для сайта и печати." }
    ],
    contactTitle: "Обсудим съёмку",
    contactLead: "В первом письме достаточно назвать место, сроки и рассказать, где будут использоваться кадры.",
    copy: "Скопировать адрес", copied: "Адрес скопирован.", copyError: "Выделите адрес и скопируйте его вручную.",
    location: "Место", genreLabel: "Жанр", year: "Год"
  },
  en: {
    name: "Anna Lesnaya", genre: "Architectural photographer", title: "Places with a life of their own",
    lead: "I photograph buildings and interiors for architects, studios and editors. I start with the light and how people use the space.",
    navigation: "Portfolio", work: "Work", about: "Approach", contact: "Contact", seeWork: "Explore the work",
    back: "Back to examples", top: "Back to top",
    workTitle: "Selected work", filter: "Project type", all: "All", architecture: "Architecture", interiors: "Interiors",
    aboutTitle: "How a shoot works", aboutLead: "We start with where the photos will appear. That helps us choose the time of day and the views to capture.",
    process: [
      { title: "Understand the brief", description: "I review plans and references and ask which rooms and details matter most." },
      { title: "Choose the time", description: "I check the light on location. The exterior and interior may need separate sessions." },
      { title: "Build the series", description: "I select wide shots and details and prepare the images for web and print." }
    ],
    contactTitle: "Let's discuss a shoot",
    contactLead: "In your first email, tell me the location, timing and where you plan to use the images.",
    copy: "Copy address", copied: "Address copied.", copyError: "Select the address and copy it manually.",
    location: "Location", genreLabel: "Genre", year: "Year"
  }
} as const;
