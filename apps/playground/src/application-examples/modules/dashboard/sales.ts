import type { InjectionKey, Ref } from "vue";
import type { PlaygroundLocale } from "../../../i18n/locale";

export const salesChannels = ["online", "retail", "partners"] as const;
export type SalesChannel = typeof salesChannels[number];
export type OrderStatus = "processing" | "shipped" | "delivered" | "refunded";

export interface SalesOrder {
  id: string;
  day: number;
  customer: string;
  product: string;
  total: number;
  channel: SalesChannel;
  status: OrderStatus;
}

export const orderTones = { processing: "warning", shipped: "info", delivered: "success", refunded: "danger" } as const;
export const workspaceKey: InjectionKey<{
  orders: Ref<SalesOrder[]>;
  orderId: Readonly<Ref<string | null>>;
  openOrders: (id?: string) => void;
}> = Symbol("Sales workspace");

export const salesLabels = {
  ru: {
    channels: { online: "Интернет-магазин", retail: "Розница", partners: "Опт" },
    statuses: { processing: "К отправке", shipped: "Отправлен", delivered: "Доставлен", refunded: "Возврат" },
    order: "Заказ", customer: "Покупатель", status: "Статус", date: "Дата", channel: "Канал", total: "Сумма"
  },
  en: {
    channels: { online: "Online shop", retail: "Retail", partners: "Wholesale" },
    statuses: { processing: "To ship", shipped: "Shipped", delivered: "Delivered", refunded: "Refunded" },
    order: "Order", customer: "Customer", status: "Status", date: "Date", channel: "Channel", total: "Amount"
  }
};

const sample = {
  ru: {
    customers: ["Анна Белова", "Илья Волков", "Мария Ким", "Роман Ли", "Ольга Сова", "Лев Орлов", "Алиса Мельник", "Иван Рощин"],
    products: ["Настольная лампа", "Керамическая чашка", "Холщовая сумка", "Настенные часы", "Блокнот в клетку", "Льняной плед"]
  },
  en: {
    customers: ["Anna Belova", "Ilya Volkov", "Maria Kim", "Roman Lee", "Olga Sova", "Lev Orlov", "Alice Melnik", "Ivan Roshchin"],
    products: ["Desk lamp", "Ceramic mug", "Canvas tote", "Wall clock", "Grid notebook", "Linen throw"]
  }
};

const lastReportDate = Date.UTC(2026, 10, 26);
export function salesDate(day: number): Date {
  return new Date(lastReportDate - day * 86400000);
}

export function salesFormat(locale: PlaygroundLocale) {
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format;
  return {
    money: new Intl.NumberFormat(locale, { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format,
    number: new Intl.NumberFormat(locale).format,
    day,
    range: (start: Date, end: Date) => day(start) + " – " + day(end) + " " + end.getUTCFullYear()
  };
}

export function createSalesOrders(locale: PlaygroundLocale): SalesOrder[] {
  const { customers, products } = sample[locale];
  const orders: SalesOrder[] = [];
  let seed = 23769;
  let id = 7348;
  function random(): number {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let day = 0; day < 180; day++) {
    const wave = 2 * Math.cos(day / 3) + 2 * Math.sin(day / 6);
    const count = 5 + Math.round(6 * (1 - day / 180) + wave + 3 * random());
    for (let index = 0; index < count; index++) {
      const route = random();
      const channel = route < 0.61 ? "online" : route < 0.87 ? "retail" : "partners";
      const statusRoll = random();
      let status: OrderStatus = "delivered";
      if (day < 4) status = (day === 0 && index === 0) || statusRoll < 0.4 ? "processing" : "shipped";
      if (day >= 4 && statusRoll < 0.045) status = "refunded";
      orders.push({
        id: "LG-" + id--,
        day,
        customer: customers[(day + index) % customers.length]!,
        product: products[(index + day * 3) % products.length]!,
        total: (Math.floor(15 + random() * 88) * 100 + 90) * (channel === "partners" ? 3 : 1),
        channel,
        status
      });
    }
  }
  return orders;
}
