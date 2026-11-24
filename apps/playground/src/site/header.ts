import { h } from "vue";

type SiteLocale = "en" | "ru";
export type SiteSection = "docs" | "catalog" | "recipes";
const labels = {
  ru: { home: "Legato UI — главная", nav: "Основная навигация", docs: "Документация", catalog: "Компоненты", recipes: "Примеры", light: "Включить светлую тему", dark: "Включить тёмную тему" },
  en: { home: "Legato UI home", nav: "Main navigation", docs: "Documentation", catalog: "Components", recipes: "Examples", light: "Switch to light theme", dark: "Switch to dark theme" }
} as const;

const paths = { docs: "", catalog: "components/", recipes: "recipes/" } as const;

interface SiteHeaderActions {
  navigate?: (event: MouseEvent, section: SiteSection) => void;
  toggleTheme?: () => void;
}

/** The release build renders this same navigation into the landing's static HTML. */
export function renderSiteHeader(locale: SiteLocale, base: string, active?: SiteSection, dark = false, actions: SiteHeaderActions = {}) {
  const text = labels[locale];
  const docs = base + (locale === "ru" ? "ru/" : "") + "docs/";
  const links = (Object.keys(paths) as SiteSection[]).map((section) => h("a", {
    "data-site-link": section,
    href: docs + paths[section],
    "aria-current": section === active ? "page" : undefined,
    onClick: (event: MouseEvent) => actions.navigate?.(event, section)
  }, text[section]));
  const icon = h("svg", {
    "aria-hidden": "true", viewBox: "0 0 24 24", width: 18, height: 18,
    fill: "none", stroke: "currentColor", "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round"
  }, [
    h("path", { class: "legato-moon", d: "M20.5 14.3A8.8 8.8 0 0 1 9.7 3.5a8.8 8.8 0 1 0 10.8 10.8Z" }),
    h("g", { class: "legato-sun" }, [
      h("circle", { cx: 12, cy: 12, r: 3.5 }),
      h("path", { d: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" })
    ])
  ]);
  return h("div", { class: "legato-head" }, [h("div", { class: "legato-head-inner" }, [
    h("a", { class: "legato-head-brand", href: base, "aria-label": text.home }, [h("span", { "aria-hidden": "true" })]),
    h("nav", { class: "legato-head-nav", "aria-label": text.nav }, links),
    h("div", { class: "legato-head-tools" }, [
      h("a", { href: "https://github.com/whitewolf06/legato-ui" }, "GitHub"),
      h("button", { id: "theme-toggle", type: "button", "aria-label": dark ? text.light : text.dark, onClick: actions.toggleTheme }, [icon])
    ])
  ])]);
}
