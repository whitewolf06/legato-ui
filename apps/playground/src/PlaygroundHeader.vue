<script setup lang="ts">
import type { WlIconName } from "legato-ui";
import type { WlMenuExpose, WlMenuItem } from "legato-ui";
import type { WlThemeName } from "legato-ui";
import { WlButton } from "legato-ui";
import { WlDrawer } from "legato-ui";
import { WlIcon } from "legato-ui";
import { WlMenu } from "legato-ui";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { PlaygroundRoute, PlaygroundView } from "./navigation";
import { type PlaygroundLocale, usePlaygroundI18n } from "./i18n";
import LegatoWordmark from "./LegatoWordmark.vue";
import PlaygroundHeaderControls from "./PlaygroundHeaderControls.vue";
import { gaviaProjectInfo } from "./project/project-info";
import GitHubMark from "./site/GitHubMark.vue";
import { type PlaygroundThemePreference, withPlaygroundTheme } from "./themes";

const props = defineProps<{
  secondary?: boolean;
  activeView: PlaygroundView;
  route?: PlaygroundRoute;
  theme: WlThemeName;
  themePreference: PlaygroundThemePreference;
  appliedThemeName?: string;
  themeOptions: Array<{ label: string; value: string }>;
  version: string;
}>();
const emit = defineEmits<{
  navigate: [view: PlaygroundView];
  theme: [theme: PlaygroundThemePreference];
  search: [];
  locale: [locale: PlaygroundLocale];
}>();
const { t, locale } = usePlaygroundI18n();
const actionProps = computed(() => ({
  theme: props.theme, themePreference: props.themePreference,
  themeOptions: props.themeOptions, appliedThemeName: props.appliedThemeName
}));
const allSections = () => [
  { view: "home", label: t("shell.PlaygroundHeader.text122"), icon: "home" },
  { view: "docs", label: t("shell.PlaygroundHeader.text123"), icon: "book" },
  { view: "font", label: t("shell.PlaygroundHeader.text124"), icon: "book" },
  { view: "system", label: t("shell.PlaygroundHeader.text125"), icon: "grid" },
  { view: "theme-builder", label: t("shell.PlaygroundHeader.text126"), icon: "sliders-h" },
  { view: "project", label: "Changelog", icon: "history" }
] as const satisfies ReadonlyArray<{ view: PlaygroundView; label: string; icon: WlIconName }>;
const sections = computed(() => allSections().filter(({ view }) => !props.secondary || (view !== "home" && view !== "docs" && view !== "font")));
const headerElement = ref<HTMLElement | null>(null);
const desktopNavigation = ref<HTMLElement | null>(null);
const measurement = ref<HTMLElement | null>(null);
const overflowMenu = ref<WlMenuExpose | null>(null);
const visibleCount = ref<number>(sections.value.length);
const visibleSections = computed(() => sections.value.slice(0, visibleCount.value));
const overflowSections = computed(() => sections.value.slice(visibleCount.value));
const overflowCurrent = computed(() => overflowSections.value.some((section) => section.view === props.activeView));
const overflowItems = computed<WlMenuItem[]>(() => overflowSections.value.map((section) => ({
  key: section.view, label: section.label, icon: section.icon, command: () => navigate(section.view)
})));
const overflowOpen = ref(false);
const menuVisible = ref(false);
let compactViewport: MediaQueryList | undefined;
let resizeObserver: ResizeObserver | undefined;
let measurementFrame: number | undefined;
let menuFocusFrame: number | undefined;
let mounted = false;
let lastNavigationFocus: HTMLElement | null = null;

function rememberNavigationFocus(event: FocusEvent): void {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (target === document.body) return;
  lastNavigationFocus = target && (desktopNavigation.value?.contains(target)
    || headerElement.value?.querySelector(".pg-menu-trigger")?.contains(target))
    ? target
    : null;
}
function clearNavigationFocus(event: PointerEvent): void {
  if (!(event.target instanceof Node) || !lastNavigationFocus?.contains(event.target)) lastNavigationFocus = null;
}

function cancelMenuFocus(): void {
  if (menuFocusFrame !== undefined) window.cancelAnimationFrame(menuFocusFrame);
  menuFocusFrame = undefined;
}
function restoreMenuFocus(): void {
  cancelMenuFocus();
  menuFocusFrame = window.requestAnimationFrame(() => {
    menuFocusFrame = undefined;
    if (menuVisible.value || overflowOpen.value) return;
    if (compactViewport?.matches && props.secondary) {
      document.querySelector<HTMLElement>(".legato-head-menu-toggle")?.focus({ preventScroll: true });
      return;
    }
    const selector = compactViewport?.matches ? ".pg-menu-trigger" : '.pg-views [aria-current="page"], .pg-overflow-trigger';
    headerElement.value?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  });
}
function closeOverflow(): void {
  overflowMenu.value?.hide();
  overflowOpen.value = false;
}
function measureNavigation(): void {
  if (!desktopNavigation.value || !measurement.value || compactViewport?.matches) return;
  const buttons = [...measurement.value.querySelectorAll<HTMLElement>("[data-nav-measure]")];
  const widths = buttons.map((button) => button.getBoundingClientRect().width);
  const count: number = sections.value.length;
  if (widths.length !== count + 1) return;
  const gap = Number.parseFloat(getComputedStyle(desktopNavigation.value).columnGap) || 0;
  const repository = desktopNavigation.value.querySelector<HTMLElement>(".pg-repository");
  const available = desktopNavigation.value.clientWidth - (repository ? repository.offsetWidth + gap : 0);
  const total = widths.slice(0, count).reduce((sum, width) => sum + width, 0) + gap * (count - 1);
  let nextCount = count;
  if (total > available) {
    nextCount = count - 1;
    while (nextCount > 0 && widths.slice(0, nextCount).reduce((sum, width) => sum + width, 0)
      + gap * nextCount + widths[count]! > available) nextCount--;
  }
  if (nextCount === visibleCount.value) return;
  const focusedElement = document.activeElement === document.body ? lastNavigationFocus : document.activeElement;
  const focusedButton = [...desktopNavigation.value.querySelectorAll<HTMLElement>("button")]
    .findIndex((button) => button.contains(focusedElement));
  const focusedOverflow = focusedButton === visibleCount.value;
  const activeIndex = sections.value.findIndex((section) => section.view === props.activeView);
  const activeMovesOutOfMenu = activeIndex >= visibleCount.value && activeIndex < nextCount;
  const moveFocus = focusedButton >= 0 && (focusedOverflow
    ? nextCount === count || activeMovesOutOfMenu
    : focusedButton >= nextCount);
  const restoreFocus = overflowOpen.value || moveFocus;
  closeOverflow();
  visibleCount.value = nextCount;
  if (restoreFocus) void nextTick(restoreMenuFocus);
}
function scheduleMeasurement(): void {
  if (!mounted || measurementFrame !== undefined) return;
  measurementFrame = window.requestAnimationFrame(() => {
    measurementFrame = undefined;
    measureNavigation();
  });
}
function syncViewport(): void {
  // A control hidden by the media query can blur before its change event arrives.
  const focusedElement = document.activeElement === document.body ? lastNavigationFocus : document.activeElement;
  const focusedControl = compactViewport?.matches
    ? desktopNavigation.value?.contains(focusedElement)
    : headerElement.value?.querySelector(".pg-menu-trigger")?.contains(focusedElement);
  const wasOpen = menuVisible.value || overflowOpen.value || focusedControl;
  menuVisible.value = false;
  closeOverflow();
  scheduleMeasurement();
  if (wasOpen) void nextTick(restoreMenuFocus);
}
function openMenu(): void {
  cancelMenuFocus();
  closeOverflow();
  menuVisible.value = true;
}
function openOverflow(event: Event): void {
  cancelMenuFocus();
  if (event instanceof KeyboardEvent) overflowMenu.value?.show(event);
  else overflowMenu.value?.toggle(event);
}
async function markOverflowOpen(): Promise<void> {
  overflowOpen.value = true;
  await nextTick();
  const links = [...document.querySelectorAll<HTMLElement>('#pg-overflow-navigation [role="menuitem"]')];
  links.forEach((link, index) => {
    if (overflowSections.value[index]?.view === props.activeView) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
function activateMenuItem(event: KeyboardEvent): void {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.click();
}
function navigate(view: PlaygroundView): void {
  const fromOverflow = overflowOpen.value;
  closeOverflow();
  menuVisible.value = false;
  emit("navigate", view);
  if (fromOverflow) void nextTick(restoreMenuFocus);
}
watch(() => props.activeView, () => {
  menuVisible.value = false;
  closeOverflow();
});
watch(() => [props.theme, props.themePreference, props.appliedThemeName, locale.value], () => {
  void nextTick(scheduleMeasurement);
});
onMounted(() => {
  mounted = true;
  compactViewport = window.matchMedia("(max-width: 760px)");
  compactViewport.addEventListener("change", syncViewport);
  document.addEventListener("focusin", rememberNavigationFocus);
  document.addEventListener("pointerdown", clearNavigationFocus);
  resizeObserver = new ResizeObserver(scheduleMeasurement);
  for (const element of [headerElement.value, desktopNavigation.value, measurement.value]) {
    if (element) resizeObserver.observe(element);
  }
  void document.fonts.ready.then(scheduleMeasurement);
  scheduleMeasurement();
});
onBeforeUnmount(() => {
  mounted = false;
  cancelMenuFocus();
  if (measurementFrame !== undefined) window.cancelAnimationFrame(measurementFrame);
  resizeObserver?.disconnect();
  compactViewport?.removeEventListener("change", syncViewport);
  document.removeEventListener("focusin", rememberNavigationFocus);
  document.removeEventListener("pointerdown", clearNavigationFocus);
});
</script>

<template>
  <div ref="headerElement" class="pg-header-inner" :class="secondary ? 'pg-secondary legato-site-container' : 'wl-container'">
    <a
      v-if="!secondary"
      class="pg-brand"
      :href="withPlaygroundTheme('?', themePreference)"
      :aria-label="t('shell.PlaygroundHeader.text127')"
      @click.prevent="navigate('home')"
    >
      <LegatoWordmark class="pg-logo" />
      <span class="pg-kit-version" :aria-label="t('shell.PlaygroundHeader.text128') + version">v{{ version }}</span>
    </a>
    <PlaygroundHeaderControls
      v-if="secondary"
      v-bind="actionProps"
      @search="emit('search')"
      @theme="emit('theme', $event)"
      @locale="emit('locale', $event)"
    />
    <nav ref="desktopNavigation" class="pg-views" :aria-label="t('shell.PlaygroundHeader.text129')">
      <WlButton
        v-for="section in visibleSections"
        :key="section.view"
        size="sm"
        variant="ghost"
        :aria-current="activeView === section.view ? 'page' : undefined"
        @click="navigate(section.view)"
      >
        <template #icon><WlIcon :name="section.icon" :size="14" /></template>{{ section.label }}
      </WlButton>
      <WlButton
        v-if="overflowSections.length"
        class="pg-overflow-trigger"
        size="sm"
        variant="ghost"
        :aria-label="t('shell.header.moreSections')"
        :aria-current="overflowCurrent ? 'page' : undefined"
        aria-haspopup="menu"
        aria-controls="pg-overflow-navigation"
        :aria-expanded="overflowOpen"
        @click="openOverflow"
        @keydown.down.prevent="openOverflow"
      >
        {{ t('shell.header.more') }}<WlIcon name="chevron-down" :size="14" />
      </WlButton>
      <WlButton
        v-if="secondary"
        class="pg-repository"
        variant="ghost"
        size="sm"
        :href="gaviaProjectInfo.repositoryUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <template #icon><GitHubMark /></template>GitHub
      </WlButton>
    </nav>
    <PlaygroundHeaderControls
      v-if="!secondary"
      v-bind="actionProps"
      @search="emit('search')"
      @theme="emit('theme', $event)"
      @locale="emit('locale', $event)"
    />
    <WlButton
      v-if="!secondary"
      class="pg-menu-trigger"
      size="sm"
      variant="secondary"
      :aria-label="t('shell.PlaygroundHeader.text135')"
      :title="t('shell.PlaygroundHeader.text136')"
      aria-haspopup="dialog"
      aria-controls="pg-adaptive-navigation"
      :aria-expanded="menuVisible"
      @click="openMenu"
    ><template #icon><WlIcon name="bars" :size="18" /></template></WlButton>
    <div class="pg-measure-clip" aria-hidden="true" inert>
      <div ref="measurement" class="pg-nav-measure">
        <WlButton
          v-for="section in sections"
          :key="section.view"
          size="sm"
          variant="ghost"
          data-nav-measure="section"
          tabindex="-1"
        >
          <template #icon><WlIcon :name="section.icon" :size="14" /></template>{{ section.label }}
        </WlButton>
        <WlButton
          class="pg-overflow-trigger"
          size="sm"
          variant="ghost"
          data-nav-measure="overflow"
          tabindex="-1"
        >
          {{ t('shell.header.more') }}<WlIcon name="chevron-down" :size="14" />
        </WlButton>
      </div>
    </div>
  </div>
  <WlMenu
    :key="visibleCount"
    ref="overflowMenu"
    class="pg-overflow-menu"
    popup
    :items="overflowItems"
    :aria-label="t('shell.PlaygroundHeader.text138')"
    :pt="{ list: { id: 'pg-overflow-navigation' }, itemLink: { onKeydown: activateMenuItem } }"
    @open="markOverflowOpen"
    @close="overflowOpen = false"
  />
  <WlDrawer
    v-if="!secondary"
    v-model:visible="menuVisible"
    :header="t('shell.PlaygroundHeader.text138')"
    position="right"
    :pt="{ root: { id: 'pg-adaptive-navigation', style: { width: 'min(360px, 100%)' } } }"
    @close="restoreMenuFocus"
  >
    <nav class="pg-menu-links" :aria-label="t('shell.PlaygroundHeader.text139')">
      <WlButton
        v-for="section in sections"
        :key="section.view"
        block
        :variant="activeView === section.view ? 'soft' : 'ghost'"
        :aria-current="activeView === section.view ? 'page' : undefined"
        @click="navigate(section.view)"
      >
        <template #icon><WlIcon :name="section.icon" :size="18" /></template>{{ section.label }}
      </WlButton>
    </nav>
    <template #footer><span class="pg-menu-meta">Legato UI · v{{ version }}</span></template>
  </WlDrawer>
</template>

<style scoped>
.pg-header-inner {
  min-height: 64px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--wl-space-md);
  padding-block: var(--wl-space-md);
}
.pg-header-inner.pg-secondary { grid-template-columns: auto minmax(0, 1fr); min-height: 42px; padding-block: 4px; }
.pg-secondary .pg-views { justify-content: flex-end; }
.pg-secondary :is(.pg-views, .pg-nav-measure) :deep(.wl-btn) { padding-inline: var(--wl-space-sm); }
.pg-brand {
  color: var(--wl-text);
  text-decoration: none;
  border-radius: var(--wl-radius-sm);
  display: inline-flex;
  justify-self: start;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.pg-brand:focus-visible { outline: 2px solid var(--wl-focus-color); outline-offset: 4px; }
.pg-logo { width: 104px; flex: none; }
.pg-kit-version {
  display: block;
  flex: none;
  padding: 3px 6px;
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-radius-sm);
  color: var(--wl-text-2);
  font-family: var(--wl-mono);
  font-size: 11px;
  line-height: 1;
}
.pg-views, .pg-nav-measure { display: flex; flex-wrap: nowrap; align-items: center; gap: 4px; }
.pg-views { justify-content: center; min-width: 0; }
.pg-views :deep(.wl-btn), .pg-nav-measure :deep(.wl-btn) { flex: none; white-space: nowrap; }
.pg-views [aria-current="page"] { background: var(--wl-accent-soft); color: var(--wl-text); }
.pg-overflow-trigger :deep(.wl-btn__label) { display: inline-flex; align-items: center; gap: 6px; }
:global(.pg-overflow-menu [aria-current="page"]) { background: var(--wl-accent-soft); color: var(--wl-text); }
.pg-menu-trigger { display: none; }
.pg-menu-links { display: grid; gap: var(--wl-space-sm); }
.pg-menu-links :deep(.wl-btn) { justify-content: flex-start; min-height: 44px; }
.pg-menu-meta { color: var(--wl-text-muted); font-size: var(--wl-type-small-size); }
.pg-measure-clip { position: fixed; top: 0; left: 0; width: 0; height: 0; overflow: hidden; visibility: hidden; pointer-events: none; }
.pg-nav-measure { width: max-content; }
@media (max-width: 760px) {
  .pg-header-inner {
    grid-template: "brand menu" auto "actions actions" auto / minmax(0, 1fr) auto;
    gap: 7px;
    padding-block: var(--wl-space-sm);
  }
  .pg-header-inner.pg-secondary { grid-template: "actions" auto / minmax(0, 1fr); padding-block: 6px; }
  .pg-brand { grid-area: brand; gap: 6px; min-width: 0; }
  .pg-logo { width: 88px; }
  .pg-kit-version, .pg-views { display: none; }
  .pg-actions { grid-area: actions; }
  .pg-menu-trigger { grid-area: menu; display: inline-flex; width: 44px; height: 44px; padding: 0; justify-content: center; }
}
</style>
