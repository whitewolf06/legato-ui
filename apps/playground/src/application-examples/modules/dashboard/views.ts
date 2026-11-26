import type { WlIconName } from "legato-ui";

export const dashboardViews = [
  { id: "dashboard", icon: "chart-bar", ru: "Панель продаж", en: "Sales dashboard" },
  { id: "orders", icon: "box", ru: "Заказы", en: "Orders" },
  { id: "board", icon: "list-check", ru: "Доска задач", en: "Task board" },
  { id: "calendar", icon: "calendar", ru: "Календарь команды", en: "Team calendar" },
  { id: "settings", icon: "settings", ru: "Настройки проекта", en: "Project settings" }
] as const satisfies readonly { id: string; icon: WlIconName; ru: string; en: string }[];

export type DashboardViewId = typeof dashboardViews[number]["id"];

export function dashboardView(id: string | null) {
  return dashboardViews.find((view) => view.id === id);
}
