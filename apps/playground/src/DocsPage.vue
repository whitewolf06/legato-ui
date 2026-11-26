<script setup lang="ts">
import { usePlaygroundI18n } from "./i18n";
const props = withDefaults(defineProps<{
  component?: string;
  section?: DocumentationSection;
  theme?: WlThemeName;
}>(), { theme: playgroundDefaultTheme });
const emit = defineEmits<{
  component: [name: string | undefined];
  section: [name: DocumentationSection | undefined];
  anchor: [anchor: string];
  navigate: [view: "system" | "project" | "components"];
}>();
const { t } = usePlaygroundI18n();
import type { AsyncComponentLoader, Component } from "vue";
import { WlButton, WlIcon, WlIconButton, WlInput, type WlThemeName } from "legato-ui";
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getLocalizedManifest, isComponentNewInRelease } from "./documentation/manifest";
const wlManifest = getLocalizedManifest();
import CodePanel from "./design-system/CodePanel.vue";
import { componentGuideLoaders } from "./page-loaders";
import PlaygroundPageLoading from "./PlaygroundPageLoading.vue";
const asyncContent = <Page extends Component>(loader: AsyncComponentLoader<Page>) => defineAsyncComponent({
  loader, loadingComponent: PlaygroundPageLoading, errorComponent: PlaygroundPageLoading, delay: 0
});
import { documentationAssetPages, documentationAssets } from "./documentation/assets/assets";
const DocumentationAssetsPage = asyncContent(() => import("./documentation/assets/DocumentationAssetsPage.vue"));
const ButtonDocumentation = asyncContent(componentGuideLoaders.button);
import { documentationCategories, documentationFoundationPages, documentationFoundations, type DocumentationHeading, documentationOverviewHeadings, foundationHeadings, installationSource } from "./documentation/catalog";
import { componentExampleTopics } from "./documentation/components/topics";
const ComponentDocumentation = asyncContent(componentGuideLoaders.standard);
const FoundationPage = asyncContent(() => import("./documentation/foundations/FoundationPage.vue"));
const DocumentationQualityPage = asyncContent(() => import("./documentation/quality/DocumentationQualityPage.vue"));
const GuidePage = asyncContent(() => import("./documentation/GuidePage.vue"));
import { documentationGuide, documentationGuideHeadingId, documentationGuideSections } from "./documentation/guides";
import InstallationCommand from "./documentation/InstallationCommand.vue";
import PageOutline from "./documentation/PageOutline.vue";
import { documentationQualityPage } from "./documentation/quality/quality";
import { useDocumentationScrollspy } from "./documentation/useDocumentationScrollspy";
import { playgroundLocale } from "./i18n";
import { createPlaygroundNavigationUrl as createPlaygroundUrl, type DocumentationSection, isDocumentationAssetSection, isDocumentationFoundationSection, isDocumentationGuideSection, isDocumentationQualitySection } from "./navigation";
import PlaygroundPageHeader from "./PlaygroundPageHeader.vue";
import { gaviaProjectInfo } from "./project/project-info";
import { hostedSite } from "./site/target";
import { playgroundDefaultTheme, playgroundThemePreference, withPlaygroundTheme } from "./themes";
import { usePageAnchor } from "./usePageAnchor";

const foundationSection = computed(() => isDocumentationFoundationSection(props.section) ? props.section : undefined);
const assetSection = computed(() => isDocumentationAssetSection(props.section) ? props.section : undefined);
const qualitySection = computed(() => isDocumentationQualitySection(props.section) ? props.section : undefined);
const guideSection = computed(() => isDocumentationGuideSection(props.section) ? props.section : undefined);
const guide = computed(() => guideSection.value ? documentationGuide(guideSection.value, playgroundLocale.value) : undefined);
const guideLinks = computed(() => documentationGuideSections.filter((key) => key !== "installation")
  .map((key) => ({ key, ...documentationGuide(key, playgroundLocale.value) })));
const pageElement = ref<HTMLElement | null>(null);
const contentElement = ref<HTMLElement | null>(null);
const catalogGroups = computed(() => documentationCategories.map((category) => ({
  ...category,
  entries: wlManifest.filter((item) => item.category === category.key)
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
})).filter((group) => group.entries.length));
const selectedComponent = computed(() => {
  if (props.section === "components") return catalogGroups.value[0]?.entries[0]?.name;
  return props.section ? undefined : props.component;
});
const entry = computed(() => wlManifest.find((item) => item.name === selectedComponent.value));
const inCatalog = computed(() => props.section === "components" || !!entry.value);
const sidebarLabel = computed(() => t(inCatalog.value ? "documentation.strings.s0840" : "documentation.strings.s0833"));
const headingIds = computed(() => guideSection.value
  ? [
      ...(guideSection.value === "recipes" ? ["recipe-applications", "recipe-simple"] : []),
      ...(guide.value?.sections.map((item, index) => documentationGuideHeadingId(guideSection.value!, item, index)) ?? [])
    ]
  : qualitySection.value
    ? documentationQualityPage.headings.map((heading) => heading.id)
    : foundationSection.value
      ? foundationHeadings(foundationSection.value).map((heading) => heading.id)
      : assetSection.value
        ? documentationAssets.find((asset) => asset.key === assetSection.value)?.headings.map((heading) => heading.id)
        : selectedComponent.value === "WlButton"
          ? ["docs-button-variants", "docs-button-sizes", "docs-button-states", "docs-button-slot-layout", "docs-button-form", "docs-button-usage", "docs-button-props", "docs-button-events", "docs-button-slots", "docs-button-pt", "docs-button-accessibility"]
          : selectedComponent.value
            ? [...componentExampleTopics(selectedComponent.value).map((topic) => topic.id), "examples", "service", "props", "events", "slots", "pt", "accessibility"]
                .map((key) => "docs-" + selectedComponent.value!.toLowerCase() + "-" + key)
            : documentationOverviewHeadings.map((heading) => heading.id));
const { activeId, headings: currentHeadings } = useDocumentationScrollspy({
  root: contentElement,
  key: () => [props.component, props.section],
  headingIds: () => headingIds.value
});
usePageAnchor(pageElement);

const categoryLabel = computed(() => documentationCategories.find((category) => category.key === entry.value?.category)?.label);
const pageIntroduction = computed(() => {
  if (entry.value) {
    return { title: entry.value.name, description: entry.value.description ?? "", breadcrumbs: [
      { label: t("documentation.strings.s0839"), route: { view: "docs" as const, section: "components" as const } },
      { label: entry.value.name }
    ] };
  }
  const metadata = qualitySection.value
    ? documentationQualityPage
    : assetSection.value
      ? documentationAssetPages[assetSection.value]
      : foundationSection.value ? documentationFoundationPages[foundationSection.value] : undefined;
  const title = guide.value?.title ?? metadata?.label ?? t("documentation.strings.s0827");
  const description = guide.value?.description ?? metadata?.description ?? t("documentation.strings.s0828");
  return { title, description, breadcrumbs: metadata || guide.value
    ? [{ label: t("documentation.strings.s0827"), route: { view: "docs" as const } }, { label: title }]
    : [{ label: t("documentation.strings.s0827") }] };
});
const componentQuery = ref("");
const groups = computed(() => {
  const needle = componentQuery.value.trim().toLowerCase();
  if (!needle) return catalogGroups.value;
  return catalogGroups.value.map((group) => ({
    ...group,
    entries: group.entries.filter((item) => item.name.toLowerCase().includes(needle) || item.description?.toLowerCase().includes(needle))
  })).filter((group) => group.entries.length);
});
async function clearComponentSearch(): Promise<void> {
  componentQuery.value = "";
  await nextTick();
  pageElement.value?.querySelector<HTMLInputElement>("#docs-component-search")?.focus();
}
const overviewSections = documentationOverviewHeadings;
const [
  installHeading, foundationsHeading, componentsHeading, tokensHeading, iconsHeading, migrationHeading
] = documentationOverviewHeadings;
const isMobile = ref(false);
const mobileMenuOpen = ref(false);
const menuElement = ref<HTMLDetailsElement | null>(null);
function closeMobileMenu(): void {
  mobileMenuOpen.value = false;
  if (isMobile.value && menuElement.value) menuElement.value.open = false;
}
function navigateComponent(name: string): void {
  closeMobileMenu();
  emit("component", name);
}
let mobileMedia: MediaQueryList | undefined;
function updateMobile(): void {
  isMobile.value = mobileMedia?.matches ?? false;
}
function toggleMenu(event: Event): void {
  if (isMobile.value) mobileMenuOpen.value = (event.currentTarget as HTMLDetailsElement).open;
}
const qualityHref = computed(() => {
  const current = new URL(typeof window === "undefined" ? "http://localhost/" : window.location.href);
  const target = createPlaygroundUrl(current, { view: "docs", section: "quality" });
  return withPlaygroundTheme(target.pathname + target.search, playgroundThemePreference.value);
});
function guideHref(section: DocumentationSection): string {
  const target = createPlaygroundUrl(new URL(typeof window === "undefined" ? "http://localhost/" : window.location.href), { view: "docs", section });
  return target.pathname + target.search + target.hash;
}
function componentHref(component: string): string {
  const target = createPlaygroundUrl(new URL(typeof window === "undefined" ? "http://localhost/" : window.location.href), { view: "docs", component });
  return target.pathname + target.search;
}
function followComponent(event: MouseEvent, name: string): void {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigateComponent(name);
}
function navigateGuide(event: MouseEvent, section: DocumentationSection): void {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  closeMobileMenu();
  emit("section", section);
}
function navigateQuality(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  closeMobileMenu();
  emit("section", "quality");
}
function navigateAnchor(event: MouseEvent, heading: DocumentationHeading): void {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  closeMobileMenu();
  emit("anchor", heading.id);
}
watch(() => [props.component, props.section], () => {
  closeMobileMenu();
  if (!props.component) componentQuery.value = "";
});
onMounted(() => {
  mobileMedia = window.matchMedia("(max-width: 760px)");
  updateMobile();
  mobileMedia.addEventListener("change", updateMobile);
});
onBeforeUnmount(() => {
  mobileMedia?.removeEventListener("change", updateMobile);
});
</script>

<template>
  <main
    ref="pageElement"
    class="docs-page"
    :class="{ 'legato-site-container': hostedSite }"
    data-testid="docs-page"
    :aria-label="t('documentation.strings.s0829')"
  >
    <div class="docs-layout">
      <PlaygroundPageHeader
        class="docs-page-header"
        :title="pageIntroduction.title"
        :description="pageIntroduction.description"
        :breadcrumbs="pageIntroduction.breadcrumbs"
      >
        <template v-if="entry" #meta>
          <span>{{ t('documentation.strings.s0830') }} {{ categoryLabel }}</span>
          <span class="docs-version" :title="t('documentation.strings.s0841') + entry.introducedIn">
            v{{ entry.introducedIn }}
          </span>
        </template>
        <template v-if="entry" #actions>
          <WlButton v-if="entry.name === 'WlIcon'" size="sm" @click="emit('section', 'icons')">
            {{ t('documentation.strings.s0004') }}
          </WlButton>
          <WlButton
            class="docs-design-rules"
            size="sm"
            variant="secondary"
            @click="emit('navigate', 'system')"
          >{{ t('documentation.strings.s0832') }}</WlButton>
        </template>
      </PlaygroundPageHeader>
      <aside class="docs-sidebar" :aria-label="sidebarLabel" :data-testid="inCatalog ? 'component-catalog' : undefined">
        <details
          ref="menuElement"
          class="docs-menu"
          :open="!isMobile || mobileMenuOpen"
          @toggle="toggleMenu"
        >
          <summary class="docs-menu-summary">{{ sidebarLabel }}</summary>
          <div v-if="!inCatalog" class="docs-menu-content wl-stack" data-space="lg">
            <nav class="docs-guide-nav" :aria-label="playgroundLocale === 'ru' ? 'Руководства' : 'Guides'">
              <a
                v-for="link in guideLinks"
                :key="link.key"
                class="docs-component-link"
                :href="guideHref(link.key)"
                :aria-current="section === link.key ? 'page' : undefined"
                @click="navigateGuide($event, link.key)"
              >{{ link.title }}</a>
            </nav>
            <section class="docs-nav-section wl-stack" data-space="sm" :aria-label="t('documentation.strings.s0834')">
              <h2 class="docs-sidebar-heading">
                <span class="docs-sidebar-mark docs-sidebar-book">
                  <WlIcon class="docs-sidebar-icon docs-sidebar-icon--book" name="book" :size="16" />
                </span>{{ t('documentation.strings.s0834') }}
              </h2>
              <nav :aria-label="t('documentation.strings.s0835')">
                <a
                  class="docs-component-link"
                  :href="guideHref('installation')"
                  :aria-current="section === 'installation' ? 'page' : undefined"
                  @click="navigateGuide($event, 'installation')"
                >{{ installHeading.title }}</a>
              </nav>
              <div class="docs-foundation-nav">
                <a
                  class="docs-component-link docs-quality-link"
                  :href="qualityHref"
                  :aria-current="qualitySection ? 'page' : undefined"
                  @click="navigateQuality"
                >{{ documentationQualityPage.label }}</a>
              </div>
            </section>
            <nav class="docs-nav-section wl-stack" data-space="xs" :aria-label="t('documentation.strings.s0837')">
              <h2 class="docs-sidebar-heading">
                <span class="docs-sidebar-mark"><WlIcon class="docs-sidebar-icon" name="grid" :size="16" /></span>
                {{ t('documentation.strings.s0837') }}
              </h2>
              <div v-for="foundation in documentationFoundations" :key="foundation.key" class="docs-foundation-nav">
                <button
                  type="button"
                  class="docs-component-link"
                  :aria-current="section === foundation.key ? 'page' : undefined"
                  @click="emit('section', foundation.key)"
                >{{ foundation.label }}</button>
              </div>
            </nav>
            <nav class="docs-nav-section wl-stack" data-space="xs" :aria-label="t('documentation.strings.s0838')">
              <h2 class="docs-sidebar-heading">
                <span class="docs-sidebar-mark"><WlIcon class="docs-sidebar-icon" name="image" :size="16" /></span>
                {{ t('documentation.strings.s0838') }}
              </h2>
              <div v-for="asset in documentationAssets" :key="asset.key" class="docs-foundation-nav">
                <button
                  type="button"
                  class="docs-component-link"
                  :aria-current="section === asset.key ? 'page' : undefined"
                  @click="emit('section', asset.key)"
                >{{ asset.label }}</button>
              </div>
            </nav>
            <a class="docs-sidebar-heading docs-catalog-entry" :href="guideHref('components')" @click="navigateGuide($event, 'components')">
              <span class="docs-sidebar-mark"><WlIcon name="box" :size="16" /></span>
              {{ t('documentation.strings.s0839') }}
              <WlIcon name="arrow-right" :size="14" />
            </a>
          </div>
          <section v-else class="docs-menu-content docs-nav-section wl-stack" data-space="md">
            <h2 class="docs-sidebar-heading">
              <span class="docs-sidebar-mark"><WlIcon class="docs-sidebar-icon" name="box" :size="16" /></span>
              {{ t('documentation.strings.s0839') }}
            </h2>
            <WlInput
              id="docs-component-search"
              v-model="componentQuery"
              class="docs-component-search"
              size="sm"
              type="search"
              :placeholder="t('documentation.componentSearch.label')"
              :aria-label="t('documentation.componentSearch.label')"
              aria-controls="docs-component-catalog"
              autocomplete="off"
              spellcheck="false"
              @keydown.esc.prevent.stop="clearComponentSearch"
            >
              <template #prefix><WlIcon name="search" :size="14" /></template>
              <template v-if="componentQuery" #suffix><WlIconButton
                class="docs-component-search-clear"
                size="sm"
                icon="x"
                :aria-label="t('documentation.componentSearch.clear')"
                :title="t('documentation.componentSearch.clear')"
                @click="clearComponentSearch"
              /></template>
            </WlInput>
            <p v-if="!groups.length" class="docs-component-search-empty wl-text-small wl-text-muted" role="status">
              {{ t('documentation.componentSearch.empty') }}
            </p>
            <nav id="docs-component-catalog" class="docs-catalog" :aria-label="t('documentation.strings.s0840')">
              <section v-for="group in groups" :key="group.key" class="docs-catalog-group">
                <h3 class="docs-category-label">{{ group.label }}</h3>
                <ul class="docs-catalog-list">
                  <li v-for="item in group.entries" :key="item.name">
                    <a
                      :href="componentHref(item.name)"
                      class="docs-component-link"
                      :aria-label="item.name"
                      :aria-describedby="isComponentNewInRelease(item.introducedIn, gaviaProjectInfo.version)
                        ? 'docs-catalog-version-' + item.name : undefined"
                      :aria-current="selectedComponent === item.name ? 'page' : undefined"
                      @click="followComponent($event, item.name)"
                    >
                      <span class="docs-component-name">{{ item.name }}</span>
                      <span
                        v-if="isComponentNewInRelease(item.introducedIn, gaviaProjectInfo.version)"
                        :id="'docs-catalog-version-' + item.name"
                        class="docs-component-version"
                        :title="t('documentation.strings.s0841') + item.introducedIn"
                      >{{ playgroundLocale === 'ru' ? 'Новое' : 'New' }}</span>
                    </a>
                  </li>
                </ul>
              </section>
            </nav>
          </section>
        </details>
      </aside>

      <PageOutline
        v-if="currentHeadings.length"
        class="docs-on-page"
        :class="{ 'docs-on-page--compact': section && !entry }"
        :headings="currentHeadings"
        :active-id="activeId"
        @follow="navigateAnchor"
      />
      <div ref="contentElement" class="docs-content wl-stack" data-space="2xl">
        <GuidePage v-if="guideSection" :section="guideSection" />
        <DocumentationQualityPage v-else-if="qualitySection" />
        <DocumentationAssetsPage
          v-else-if="assetSection"
          :key="assetSection"
          :section="assetSection"
          :theme="theme"
        />
        <FoundationPage
          v-else-if="foundationSection"
          :key="foundationSection"
          :section="foundationSection"
          @component="emit('component', $event)"
          @navigate="emit('navigate', $event)"
        />
        <template v-else-if="entry">

          <component
            :is="entry.name === 'WlButton' ? ButtonDocumentation : ComponentDocumentation"
            :key="entry.name"
            :entry="entry"
          >
            <template #outline>
              <details v-if="entry.name === 'WlButton' && currentHeadings.length" class="button-compact-outline">
                <summary>{{ t('documentation.strings.s0836') }}</summary>
                <nav :aria-label="t('documentation.strings.s0836')">
                  <a
                    v-for="heading in currentHeadings"
                    :key="heading.id"
                    :href="'#' + heading.id"
                    @click="navigateAnchor($event, heading)"
                  >{{ heading.title }}</a>
                </nav>
              </details>
              <nav
                v-else-if="currentHeadings.length"
                class="docs-section-links docs-component-outline"
                :aria-label="t('documentation.strings.s0836')"
              ><a
                v-for="heading in currentHeadings"
                :key="heading.id"
                class="docs-anchor-link"
                :href="'#' + heading.id"
                @click="navigateAnchor($event, heading)"
              >{{ heading.title }}</a></nav>
            </template>
          </component>
        </template>

        <template v-else>
          <p v-if="component" class="docs-notice wl-text-small" role="alert">
            {{ t('documentation.strings.s0843') }}{{ component }}{{ t('documentation.strings.s0844') }}
          </p>
          <nav class="docs-section-links" :aria-label="t('documentation.strings.s0845')"><a
            v-for="overviewSection in overviewSections"
            :key="overviewSection.id"
            class="docs-anchor-link"
            :href="'#' + overviewSection.id"
            @click="navigateAnchor($event, overviewSection)"
          >{{ overviewSection.title }}</a></nav>
          <section class="docs-overview-section wl-stack" data-space="lg">
            <div class="wl-stack" data-space="sm">
              <p class="docs-eyebrow">{{ t('documentation.strings.s0846') }}</p>
              <h2 :id="installHeading.id" class="wl-text-heading">{{ installHeading.title }}</h2>
              <p class="wl-text-body wl-text-muted">{{ t('documentation.strings.s0847') }}</p>
            </div>
            <InstallationCommand include-vue />
            <CodePanel :source="installationSource" :title="t('documentation.strings.s0849')" :expanded="true" />
            <p class="wl-text-small wl-text-muted">
              {{ t('documentation.strings.s0850') }} <code>legato-ui/themes/</code>
              {{ t('documentation.strings.s0851') }} <code>data-wl-theme</code>
              {{ t('documentation.strings.s0852') }} <code>legato-ui/styles/fonts/legato.css</code>.
            </p>
            <a class="docs-text-link" :href="guideHref('installation')" @click="navigateGuide($event, 'installation')">
              {{ t('documentation.strings.installationGuide') }}
            </a>
          </section>

          <section class="docs-overview-section wl-stack" data-space="lg">
            <div class="wl-stack" data-space="sm">
              <h2 :id="foundationsHeading.id" class="wl-text-heading">{{ foundationsHeading.title }}</h2>
              <p class="wl-text-body wl-text-muted">{{ t('documentation.strings.s0853') }}</p>
            </div>
            <div class="wl-grid" data-space="lg">
              <article
                v-for="foundation in documentationFoundations"
                :key="foundation.key"
                class="wl-surface wl-stack"
                data-space="md"
              >
                <h3 class="wl-text-subheading">{{ foundation.label }}</h3>
                <p class="wl-text-body wl-text-muted">{{ foundation.description }}</p>
                <div>
                  <WlButton size="sm" @click="emit('section', foundation.key)">
                    {{ t('documentation.strings.s1281', { section: foundation.label }) }}
                  </WlButton>
                </div>
              </article>
            </div>
          </section>
          <section class="docs-overview-section wl-stack" data-space="lg">
            <div class="wl-stack" data-space="sm">
              <p class="docs-eyebrow">{{ t('documentation.strings.s0855') }}</p>
              <h2 :id="componentsHeading.id" class="wl-text-heading">
                <a :href="guideHref('components')" @click="navigateGuide($event, 'components')">{{ componentsHeading.title }}</a>
              </h2>
              <p class="wl-text-body wl-text-muted">
                {{ t('documentation.strings.s0856') }} {{ wlManifest.length }} {{ t('documentation.strings.s0857') }}
              </p>
            </div>
            <article class="docs-pilot-card wl-stack" data-space="md">
              <p class="docs-eyebrow">{{ t('documentation.strings.s0858') }}</p><h3 class="wl-text-heading">WlButton</h3>
              <p class="wl-text-body wl-text-muted">{{ t('documentation.strings.s0859') }}</p>
              <div class="wl-inline" data-space="sm">
                <WlButton variant="primary" @click="emit('component', 'WlButton')">{{ t('documentation.strings.s0860') }}</WlButton>
                <WlButton variant="ghost" @click="emit('component', 'WlInput')">{{ t('documentation.strings.s0861') }}</WlButton>
                <WlButton variant="ghost" @click="emit('component', 'WlDialog')">{{ t('documentation.strings.s0862') }}</WlButton>
              </div>
            </article>
          </section>

          <section class="docs-overview-section wl-stack" data-space="md">
            <p class="docs-eyebrow">{{ t('documentation.strings.s0863') }}</p>
            <h2 :id="tokensHeading.id" class="wl-text-heading">{{ tokensHeading.title }}</h2>
            <p class="wl-text-body wl-text-muted">
              {{ t('documentation.strings.s0864') }} <code>--wl-*</code>{{ t('documentation.strings.s0865') }}
              <code>data-wl-theme</code>{{ t('documentation.strings.s0866') }}
            </p>
            <div class="wl-inline" data-space="sm">
              <WlButton size="sm" @click="emit('section', 'colors')">{{ t('documentation.strings.s0018') }}</WlButton>
              <WlButton size="sm" variant="ghost" @click="emit('navigate', 'system')">{{ t('documentation.strings.s0867') }}</WlButton>
              <a class="docs-text-link" href="https://github.com/whitewolf06/legato-ui/blob/main/docs/design-system.md">
                {{ t('documentation.strings.s0868') }}
              </a>
            </div>
          </section>

          <section class="docs-overview-section wl-stack" data-space="md">
            <p class="docs-eyebrow">{{ t('documentation.strings.s0869') }}</p>
            <h2 :id="iconsHeading.id" class="wl-text-heading">{{ iconsHeading.title }}</h2>
            <p class="wl-text-body wl-text-muted">
              {{ t('documentation.strings.s0870') }} <code>name</code>
              {{ t('documentation.strings.s0871') }} <code>icons:sync</code>
              {{ t('documentation.strings.s0089') }} <code>icons:check</code>.
            </p>
            <div class="wl-inline" data-space="sm">
              <WlButton size="sm" @click="emit('section', 'icons')">{{ t('documentation.strings.s0872') }}</WlButton>
              <a class="docs-text-link" href="https://github.com/whitewolf06/legato-ui/blob/main/docs/icons.md">
                {{ t('documentation.strings.s0873') }}
              </a>
            </div>
          </section>

          <section class="docs-overview-section wl-stack" data-space="md">
            <p class="docs-eyebrow">{{ t('documentation.strings.s0874') }}</p>
            <h2 :id="migrationHeading.id" class="wl-text-heading">{{ migrationHeading.title }}</h2>
            <p class="wl-text-body wl-text-muted">{{ t('documentation.strings.s0875') }}</p>
            <ul class="docs-migration-links">
              <li><a class="docs-text-link" href="https://github.com/whitewolf06/legato-ui/blob/main/docs/migration-gavia.md">
                {{ t('documentation.strings.s0876') }}
              </a></li>
              <li><a class="docs-text-link" href="https://github.com/whitewolf06/legato-ui/blob/main/docs/migration-0.8.md">
                {{ t('documentation.strings.s0877') }}
              </a></li>
              <li><a class="docs-text-link" href="https://github.com/whitewolf06/legato-ui/blob/main/docs/migration-0.5.md">
                {{ t('documentation.strings.s0878') }}
              </a></li>
            </ul>
            <div class="wl-inline" data-space="sm"><WlButton size="sm" @click="emit('navigate', 'project')">Changelog</WlButton></div>
          </section>
        </template>
      </div>
    </div>
  </main>
</template>

<style>
.docs-page { padding-block: var(--wl-space-2xl); color: var(--wl-text); }
.docs-page:not(.legato-site-container) {
  width: 100%;
  max-width: var(--wl-layout-page-max);
  margin-inline: auto;
  padding-inline: var(--wl-layout-page-gutter);
}
.docs-page-header { grid-area: heading; }
.docs-layout {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr) 180px;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas: "sidebar heading outline" "sidebar content outline";
  gap: var(--wl-space-xl);
  align-items: start;
}
.docs-sidebar {
  grid-area: sidebar;
  min-width: 0;
  position: sticky;
  top: var(--wl-playground-header-offset, 80px);
  max-height: calc(100dvh - var(--wl-playground-header-offset, 80px) - var(--wl-space-xl));
  overflow: auto;
  margin-inline-start: calc(-1 * var(--wl-space-xs));
  padding-inline: var(--wl-space-xs) var(--wl-space-md);
  border-inline-end: 1px solid var(--wl-border);
}
.docs-on-page { grid-area: outline; }
.docs-guide-nav { display: grid; gap: var(--wl-space-xs); }
.docs-sidebar-heading {
  display: flex;
  align-items: center;
  min-height: var(--wl-space-xl);
  gap: var(--wl-space-sm);
  margin: 0;
  color: var(--wl-text);
  font-size: var(--wl-type-small-size);
  line-height: var(--wl-type-small-line-height);
  font-weight: var(--wl-type-label-weight);
}
.docs-sidebar-icon { flex: none; color: var(--wl-text-muted); }
.docs-catalog-entry { color: var(--wl-text-accent); text-underline-offset: 3px; }
.docs-catalog-entry:focus-visible { outline: 2px solid var(--wl-focus-color); outline-offset: 2px; }
.docs-sidebar-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: var(--wl-space-xl);
  block-size: var(--wl-space-xl);
}
.docs-sidebar-book { padding: var(--wl-space-xs); border-radius: var(--wl-corner-control); background: var(--wl-accent-soft); }
.docs-sidebar-icon--book { color: var(--wl-text-accent); }
.docs-menu { min-width: 0; }
.docs-menu-summary {
  display: none;
  padding: var(--wl-space-md);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-control);
  color: var(--wl-text);
  background: var(--wl-bg-soft);
  font: inherit;
  cursor: pointer;
}
.docs-menu-summary:focus-visible { outline: 2px solid var(--wl-focus-color); outline-offset: 2px; }
.docs-nav-section { min-width: 0; }
.docs-nav-section + .docs-nav-section { border-block-start: 1px solid var(--wl-border); padding-block-start: var(--wl-space-lg); }
.docs-component-outline { margin-block: var(--wl-space-sm); }
.button-compact-outline { display: none; }
@media (max-width: 1200px) {
  .button-compact-outline { display: block; color: var(--wl-text-muted); font-size: var(--wl-type-small-size); }
  .button-compact-outline summary { width: fit-content; padding-block: var(--wl-space-xs); cursor: pointer; }
  .button-compact-outline summary:focus-visible { outline: 2px solid var(--wl-focus-color); outline-offset: 2px; }
  .button-compact-outline nav {
    display: grid;
    gap: var(--wl-space-xs);
    margin-top: var(--wl-space-xs);
    padding-inline-start: var(--wl-space-md);
    border-inline-start: 1px solid var(--wl-border);
  }
  .button-compact-outline a { width: fit-content; color: var(--wl-text-accent); text-underline-offset: 3px; }
}
.docs-component-header-actions { padding-block-start: var(--wl-space-xs); }
.docs-design-rules { background: var(--wl-bg-soft); }
:where(.docs-component-search) input::-webkit-search-cancel-button { appearance: none; }
:where(.docs-component-search) .wl-input-wrap__suffix { right: var(--wl-space-2xs); }
.docs-component-search-clear { pointer-events: auto; }
.docs-component-search-empty { margin: 0; padding-inline: var(--wl-space-sm); }
.docs-catalog { min-width: 0; padding: var(--wl-space-xs); margin-inline: calc(-1 * var(--wl-space-xs)); }
.docs-catalog-group { margin-bottom: var(--wl-space-md); }
.docs-catalog-group + .docs-catalog-group { padding-block-start: var(--wl-space-md); border-block-start: 1px solid var(--wl-border); }
.docs-category-label {
  margin: 0 0 var(--wl-space-sm);
  padding-inline: var(--wl-space-sm);
  color: var(--wl-text);
  font-size: var(--wl-type-body-size);
  line-height: var(--wl-type-body-line-height);
  font-weight: 600;
}
.docs-catalog-list { margin: 0; padding: 0; list-style: none; }
.docs-component-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wl-space-sm);
  width: 100%;
  min-height: 36px;
  padding: var(--wl-space-sm);
  border: 0;
  border-radius: var(--wl-corner-control);
  background: transparent;
  color: var(--wl-text);
  font: var(--wl-type-small-size)/1.4 var(--wl-font);
  text-align: left;
  cursor: pointer;
}
.docs-foundation-nav .docs-component-link {
  min-height: var(--wl-space-2xl);
  padding-block: calc(var(--wl-space-sm) - var(--wl-space-2xs));
}
.docs-catalog-list .docs-component-link { min-height: 30px; padding: 6px var(--wl-space-sm); line-height: 1.25; text-decoration: none; }
.docs-component-name { min-width: 0; overflow-wrap: anywhere; }
.docs-component-version {
  flex: none;
  color: inherit;
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
@media (pointer: coarse) { .docs-foundation-nav .docs-component-link, .docs-catalog-list .docs-component-link { min-height: 36px; } }
.docs-quality-link { text-decoration: none; }
.docs-component-link:hover { background: var(--wl-bg-soft); }
.docs-component-link[aria-current="page"] { color: var(--wl-text-accent); background: var(--wl-accent-soft); }
.docs-pilot-mark {
  padding: 2px var(--wl-space-xs);
  border-radius: var(--wl-corner-control);
  color: var(--wl-text-muted);
  font-size: 10px;
}
.docs-content { grid-area: content; min-width: 0; overflow-wrap: anywhere; }
.docs-eyebrow { font-size: var(--wl-type-small-size); color: var(--wl-text-muted); }
.docs-version {
  font-size: var(--wl-type-small-size);
  padding: var(--wl-space-xs) var(--wl-space-sm);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-control);
  color: var(--wl-text-muted);
}
.docs-section-links { display: flex; flex-wrap: wrap; gap: var(--wl-space-sm) var(--wl-space-lg); padding-block: var(--wl-space-sm); }
.docs-section-links a, .docs-text-link { color: var(--wl-text-accent); text-underline-offset: 3px; }
.docs-component-link:focus-visible, .docs-section-links a:focus-visible, .docs-text-link:focus-visible {
  outline: 2px solid var(--wl-focus-color);
  outline-offset: 2px;
}
.docs-overview-section {
  scroll-margin-top: 90px;
  min-width: 0;
  padding-top: var(--wl-space-lg);
  border-top: 1px solid var(--wl-border);
}
.docs-pilot-card {
  padding: var(--wl-space-xl);
  background: var(--wl-bg-soft);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-surface);
}
.docs-notice {
  padding: var(--wl-space-lg);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-surface);
  background: var(--wl-bg-soft);
}
.docs-migration-links {
  display: grid;
  gap: var(--wl-space-sm);
  margin: 0;
  padding-left: var(--wl-space-lg);
  font-size: var(--wl-type-small-size);
}
@media (max-width: 1200px) {
  .docs-layout {
    grid-template-columns: 224px minmax(0, 1fr);
    grid-template-areas: "sidebar heading" "sidebar content";
    grid-template-rows: none;
  }
  .docs-layout:has(> .docs-on-page--compact) {
    grid-template-areas: "sidebar heading" "sidebar outline" "sidebar content";
  }
  .docs-on-page:not(.docs-on-page--compact) { display: none; }
}
@media (max-width: 760px) {
  .docs-sidebar { border-inline-end: 0; }
  .docs-page { padding-block: var(--wl-space-xl); }
  .docs-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "heading" "sidebar" "content";
  }
  .docs-layout:has(> .docs-on-page--compact) {
    grid-template-areas: "heading" "sidebar" "outline" "content";
  }
  .docs-sidebar {
    position: static;
    max-height: none;
    overflow: visible;
    margin-inline-start: 0;
    padding: 0;
    border-inline-start: 0;
  }
  .docs-menu-summary { display: list-item; list-style-position: inside; }
  .docs-menu-content {
    max-height: 65dvh;
    overflow: auto;
    padding: var(--wl-space-lg) var(--wl-space-xs) var(--wl-space-xs);
  }
  .docs-catalog { max-height: none; min-height: 0; }
}
</style>
