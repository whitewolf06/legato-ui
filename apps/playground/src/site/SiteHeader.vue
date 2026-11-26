<script setup lang="ts">
import { WlIcon } from "legato-ui";
import { h, nextTick, onMounted, onUnmounted, ref } from "vue";
import type { PlaygroundRoute } from "../navigation";
import { usePlaygroundI18n } from "../i18n";
import { gaviaProjectInfo } from "../project/project-info";
import GitHubMark from "./GitHubMark.vue";
import { renderSiteHeader, type SiteSection } from "./header";
import "./header.css";

defineOptions({ inheritAttrs: false });
const props = defineProps<{ language: string; route: PlaygroundRoute; dark: boolean }>();
const emit = defineEmits<{ navigate: [route: PlaygroundRoute]; toggleTheme: [] }>();
const { t } = usePlaygroundI18n();
const rootElement = ref<HTMLElement | null>(null);
const open = ref(false);
let compact: MediaQueryList | undefined;
const routes = {
  docs: { view: "docs" }, catalog: { view: "docs", section: "components" }, recipes: { view: "docs", section: "recipes" }, font: { view: "font" }
} as const;

function close(restoreFocus = false): void {
  if (!open.value) return;
  open.value = false;
  if (restoreFocus) rootElement.value?.querySelector<HTMLElement>(".legato-head-menu-toggle")?.focus({ preventScroll: true });
}

function toggle(): void {
  if (open.value) close(true);
  else {
    open.value = true;
    void nextTick(() => rootElement.value?.querySelector<HTMLElement>(".legato-head-nav a")?.focus({ preventScroll: true }));
  }
}

function outside(event: Event): void {
  if (event.target instanceof Node && !rootElement.value?.contains(event.target)) close();
}
function keydown(event: KeyboardEvent): void {
  if (!open.value || event.key !== "Escape" || event.defaultPrevented) return;
  event.preventDefault();
  close(true);
}
function resize(): void {
  close();
}
function follow(event: MouseEvent, route: PlaygroundRoute): void {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  close(event.detail === 0);
  emit("navigate", route);
}

onMounted(() => {
  compact = window.matchMedia("(max-width: 760px)");
  compact.addEventListener("change", resize);
  document.addEventListener("pointerdown", outside);
  document.addEventListener("focusin", outside);
  document.addEventListener("keydown", keydown);
});
onUnmounted(() => {
  compact?.removeEventListener("change", resize);
  document.removeEventListener("pointerdown", outside);
  document.removeEventListener("focusin", outside);
  document.removeEventListener("keydown", keydown);
});

const Navigation = () => {
  const { view, component, section } = props.route;
  const active = view === "docs"
    ? section === "recipes" ? "recipes" : component || section === "components" ? "catalog" : "docs"
    : view === "font" ? "font" : undefined;
  const language = props.language === "ru" ? "ru" : "en";
  const base = import.meta.env.BASE_URL;
  const localeBase = base + (language === "ru" ? "ru/" : "");
  const extras = [
    { view: "system", href: "system/", label: t("shell.PlaygroundHeader.text125"), icon: "grid" },
    { view: "theme-builder", href: "theme-builder/", label: t("shell.PlaygroundHeader.text126"), icon: "sliders-h" },
    { view: "project", href: "changelog/", label: "Changelog", icon: "history" }
  ] as const;
  return renderSiteHeader(language, base, active, props.dark, {
    navigate: (event: MouseEvent, key: SiteSection) => follow(event, routes[key]),
    toggleTheme: () => emit("toggleTheme"),
    rootRef: rootElement,
    menuOpen: open.value,
    toggleMenu: toggle,
    mobileLinks: [
      ...extras.map((item) => h("a", {
        key: item.view,
        href: localeBase + item.href,
        "aria-current": view === item.view ? "page" : undefined,
        onClick: (event: MouseEvent) => follow(event, { view: item.view })
      }, [h(WlIcon, { name: item.icon, size: 16 }), item.label])),
      h("a", { href: gaviaProjectInfo.repositoryUrl, target: "_blank", rel: "noopener noreferrer" }, [h(GitHubMark), "GitHub"])
    ]
  });
};
</script>

<template><Navigation /></template>
