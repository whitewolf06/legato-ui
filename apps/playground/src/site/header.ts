import { h, type VNodeChild, type VNodeRef } from "vue";

type SiteLocale = "en" | "ru";
export type SiteSection = "docs" | "catalog" | "recipes" | "font";
const labels = {
  ru: { home: "Legato UI — главная", nav: "Основная навигация", menu: "Меню", docs: "Документация", catalog: "Компоненты", recipes: "Примеры", font: "Шрифт", light: "Включить светлую тему", dark: "Включить тёмную тему" },
  en: { home: "Legato UI home", nav: "Main navigation", menu: "Menu", docs: "Documentation", catalog: "Components", recipes: "Examples", font: "Font", light: "Switch to light theme", dark: "Switch to dark theme" }
} as const;

const paths = { docs: "docs/", catalog: "docs/components/", recipes: "docs/recipes/", font: "font/" } as const;

interface SiteHeaderActions {
  navigate?: (event: MouseEvent, section: SiteSection) => void;
  toggleTheme?: () => void;
  toggleMenu?: () => void;
  menuOpen?: boolean;
  rootRef?: VNodeRef;
  mobileLinks?: VNodeChild[];
}

/** The release build renders this same navigation into the landing's static HTML. */
export function renderSiteHeader(locale: SiteLocale, base: string, active?: SiteSection, dark = false, actions: SiteHeaderActions = {}) {
  const text = labels[locale];
  const localeRoot = base + (locale === "ru" ? "ru/" : "");
  const links = (Object.keys(paths) as SiteSection[]).map((section) => h("a", {
    "data-site-link": section,
    href: localeRoot + paths[section],
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
  return h("div", {
    class: "legato-head",
    ref: actions.rootRef,
    "data-site-menu-ready": actions.toggleMenu ? "" : undefined,
    "data-site-menu-open": actions.menuOpen ? "true" : undefined
  }, [h("div", { class: "legato-head-inner legato-site-container" }, [
    h("a", { class: "legato-head-brand", href: base, "aria-label": text.home }, [h("span", { "aria-hidden": "true" })]),
    h("nav", { id: "legato-site-navigation", class: "legato-head-nav", "aria-label": text.nav }, [
      h("div", { class: "legato-head-main-links" }, links),
      actions.mobileLinks ? h("div", { class: "legato-head-extra-links" }, actions.mobileLinks) : undefined
    ]),
    h("div", { class: "legato-head-tools" }, [
      h("button", { id: "theme-toggle", type: "button", "aria-label": dark ? text.light : text.dark, onClick: actions.toggleTheme }, [icon]),
      h("button", {
        class: "legato-head-menu-toggle", type: "button", "aria-label": text.menu,
        "aria-controls": "legato-site-navigation", "aria-expanded": String(actions.menuOpen ?? false), onClick: actions.toggleMenu
      }, [h("span", { class: "legato-head-menu-icon", "aria-hidden": "true" })])
    ])
  ])]);
}
