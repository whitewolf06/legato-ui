import "../styles";
import "./demo.css";
import { WlConfig, wlLocaleEn, wlLocaleRu, type WlThemeName } from "legato-ui";
import catalogSummary from "virtual:gavia-catalog-summary";
import { createApp, defineAsyncComponent } from "vue";
import { parsePlaygroundLocale } from "../i18n/locale";
import { isPlaygroundTheme, parsePlaygroundTheme } from "../themes";
import { applicationEscapeEvent, applicationExample, applicationExamples, applicationThemeEvent } from "./catalog";

const modules = {
  dashboard: () => import("./modules/dashboard/Example.vue"),
  product: () => import("./modules/product/Example.vue"),
  chat: () => import("./modules/chat/Example.vue"),
  monitoring: () => import("./modules/monitoring/Example.vue"),
  portfolio: () => import("./modules/portfolio/Example.vue"),
  mail: () => import("./modules/mail/Example.vue"),
  subscription: () => import("./modules/subscription/Example.vue"),
  knowledge: () => import("./modules/knowledge/Example.vue"),
  newsletter: () => import("./modules/newsletter/Example.vue"),
  booking: () => import("./modules/booking/Example.vue")
};

const { search, pathname, origin } = window.location;
const query = new URLSearchParams(search);
const embedded = query.get("embed") === "1";
const locale = parsePlaygroundLocale(search, pathname);
const example = applicationExample(query.get("app")) ?? applicationExamples[0];
const root = document.documentElement;

function applyTheme(theme: WlThemeName): void {
  root.dataset.wlTheme = theme;
  root.style.colorScheme = catalogSummary.themeColorSchemes[theme];
}

root.lang = locale;
root.dataset.exampleProject = example.id;
document.title = example[locale].title + " · Legato UI";
applyTheme(parsePlaygroundTheme(search));

if (embedded) {
  window.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.origin !== origin || event.source !== window.parent || !event.data || typeof event.data !== "object") return;
    const message = event.data as { type?: unknown; theme?: unknown };
    if (message.type === applicationThemeEvent && isPlaygroundTheme(message.theme)) applyTheme(message.theme);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const overlays = document.querySelectorAll('dialog:modal, [aria-modal="true"], [role="combobox"][aria-expanded="true"]');
    if ([...overlays].some((element) => !element.closest('[inert], [hidden], [aria-hidden="true"]'))) return;
    window.parent.postMessage({ type: applicationEscapeEvent }, origin);
  });
}

const app = createApp(defineAsyncComponent(modules[example.id]), { embedded, locale });
app.use(WlConfig, { locale: locale === "ru" ? wlLocaleRu : wlLocaleEn });
app.mount("#app-example");
