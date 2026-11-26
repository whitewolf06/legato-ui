export interface MailMessage {
  id: string;
  person: string;
  address: string;
  subject: string;
  body: string;
  date: string;
  unread: boolean;
  archived: boolean;
  starred: boolean;
  sent: boolean;
  attachment?: { name: string; body: string };
}

const threads = [
  {
    id: "shoot", address: "ira@studio.example",
    ru: {
      person: "Ира Колесова", subject: "Съёмка в субботу · план", date: "сегодня, 10:42",
      body: "Привет!\n\nПодтвердила зал на субботу. Нас ждут к 10:00, поставить оборудование можно у входа со двора.\n\nСначала снимем общие планы, пока пространство пустое. В 11:30 приедет команда для кадров с людьми. Приложила план, чтобы всё было под рукой.\n\nСкажи, если нужно добавить время на свет.\nИра"
    },
    en: {
      person: "Ira Kolesova", subject: "Saturday shoot · the plan", date: "Today, 10:42",
      body: "Hi!\n\nI confirmed the hall for Saturday. They expect us at 10:00. We can unload the gear at the courtyard door.\n\nLet’s shoot the wide frames before the space fills up. The team arrives at 11:30 for the shots with people. I attached the plan so you have it handy.\n\nLet me know if you need more setup time for lighting.\nIra"
    }
  },
  {
    id: "proofs", address: "oleg@print.example", unread: true,
    ru: {
      person: "Олег · Типография", subject: "Цветопробы каталога", date: "сегодня, 09:18",
      body: "Доброе утро!\n\nЦветопробы готовы. Тёплый серый на выбранной бумаге стал немного темнее. Могу оставить два варианта на ресепшене, чтобы вы посмотрели при дневном свете.\n\nВыбрать вариант нужно до среды, тогда успеем запустить тираж в четверг.\nОлег"
    },
    en: {
      person: "Oleg · Print studio", subject: "Catalogue color proofs", date: "Today, 09:18",
      body: "Morning!\n\nThe proofs are ready. The warm gray came out a bit darker on the selected paper. I can leave both versions at reception so you can look at them in daylight.\n\nPlease choose by Wednesday so we can start printing on Thursday.\nOleg"
    }
  },
  {
    id: "contract", address: "sergey@studio.example", unread: true,
    ru: {
      person: "Сергей Павлов", subject: "Договор на декабрь", date: "вчера",
      body: "Лена, привет!\n\nПосмотри, пожалуйста, даты в договоре. Мы оставили два съёмочных дня и отдельный день на запас, если не совпадём по погоде.\n\nЕсли по срокам всё подходит, подготовлю экземпляр на подпись.\nСергей"
    },
    en: {
      person: "Sergey Pavlov", subject: "December contract", date: "Yesterday",
      body: "Hi Lena,\n\nCould you check the contract dates? We kept two shooting days and a spare day in case the weather doesn’t cooperate.\n\nIf the schedule works, I’ll prepare a copy to sign.\nSergey"
    }
  },
  {
    id: "material", address: "marina@journal.example", starred: true,
    ru: {
      person: "Марина · Редакция", subject: "Материал о библиотеке", date: "вчера",
      body: "Спасибо за подборку. Возьмём общий кадр для обложки и два крупных плана в текст.\n\nОсталось подписать авторов проекта и уточнить, можно ли показать снимок с читателями. Пришлите, пожалуйста, согласованный вариант подписи.\nМарина"
    },
    en: {
      person: "Marina · Editorial", subject: "Library feature", date: "Yesterday",
      body: "Thanks for the selection. We’ll use the wide shot for the cover and two details in the story.\n\nWe still need the project credits and permission to use the photograph with readers. Could you send over the approved caption?\nMarina"
    }
  },
  {
    id: "keys", address: "entry@hall.example",
    ru: {
      person: "Михаил · Площадка", subject: "Доступ в зал", date: "24 ноя",
      body: "На входе вас встретит администратор. Список команды уже у него. Для разгрузки можно подъехать во двор с 09:45 до 10:15.\nМихаил"
    },
    en: {
      person: "Michael · Venue", subject: "Access to the hall", date: "Nov 24",
      body: "The manager will meet you at the entrance. They have your team list. You can pull into the courtyard to unload from 09:45 to 10:15.\nMichael"
    }
  },
  {
    id: "backup", address: "oleg@print.example", archived: true,
    ru: {
      person: "Олег · Типография", subject: "Бумага для конвертов", date: "21 ноя",
      body: "Проверил остаток бумаги. На конверты хватит той же партии, что и на карточки. Отложил нужное количество.\nОлег"
    },
    en: {
      person: "Oleg · Print studio", subject: "Paper for the envelopes", date: "Nov 21",
      body: "I checked the paper stock. There’s enough from the same batch as the cards for the envelopes too. I set it aside.\nOleg"
    }
  },
  {
    id: "sent-initial", address: "ira@studio.example", sent: true,
    ru: {
      person: "Ира Колесова", subject: "План по свету", date: "20 ноя",
      body: "Возьму два источника и отражатель. Если из верхних окон будет достаточно света, начнём с естественного.\nЛена"
    },
    en: {
      person: "Ira Kolesova", subject: "Lighting plan", date: "Nov 20",
      body: "I’ll bring two lights and a reflector. If we get enough light from the high windows, we’ll start with natural light.\nLena"
    }
  }
];

export function createInbox(locale: "ru" | "en"): MailMessage[] {
  return threads.map((thread) => ({
    id: thread.id, address: thread.address, ...thread[locale],
    unread: Boolean(thread.unread), archived: Boolean(thread.archived), starred: Boolean(thread.starred), sent: Boolean(thread.sent),
    ...(thread.id === "shoot"
      ? {
          attachment: {
            name: "shoot-plan.txt",
            body: locale === "ru"
              ? "10:00 — загрузка оборудования\n10:30 — общие планы\n11:30 — съёмка команды\n13:00 — детали"
              : "10:00 — unload equipment\n10:30 — wide shots\n11:30 — team photographs\n13:00 — details"
          }
        }
      : {})
  }));
}

export const mailCopy = {
  ru: {
    brand: "Письма", address: "lena@studio.example", user: "Лена Берг",
    folders: "Папки", write: "Написать письмо", back: "К примерам", backToList: "К списку писем",
    folder: { inbox: "Входящие", starred: "Избранные", sent: "Отправленные", archive: "Архив" },
    search: "Поиск по письмам", unread: "Непрочитанное", noMatches: "Письма не найдены.", empty: "В папке пока нет писем.",
    reader: "Просмотр письма", select: "Выберите письмо из списка.",
    archive: "Убрать в архив", restore: "Вернуть во входящие", star: "Избранное", reply: "Ответить",
    archived: "Письмо в архиве.", restored: "Письмо во входящих.",
    to: "Кому", subject: "Тема письма", body: "Текст письма", send: "Отправить",
    today: "только что", delivered: "Письмо добавлено в «Отправленные».", local: "Письмо останется в демонстрации."
  },
  en: {
    brand: "Letters", address: "lena@studio.example", user: "Lena Berg",
    folders: "Folders", write: "Compose", back: "Back to examples", backToList: "Back to messages",
    folder: { inbox: "Inbox", starred: "Starred", sent: "Sent", archive: "Archive" },
    search: "Search mail", unread: "Unread", noMatches: "No mail matches your search.", empty: "This folder is empty.",
    reader: "Message reader", select: "Select a message to read it.",
    archive: "Archive this message", restore: "Move to inbox", star: "Starred", reply: "Reply",
    archived: "Message archived.", restored: "Message moved to the inbox.",
    to: "To", subject: "Subject", body: "Message", send: "Send",
    today: "Just now", delivered: "Message added to Sent.", local: "This message stays in the demo."
  }
} as const;
