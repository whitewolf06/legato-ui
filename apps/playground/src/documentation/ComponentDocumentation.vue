<script setup lang="ts">
import { usePlaygroundI18n } from "../i18n";
const props = defineProps<{ entry: WlComponentManifest }>();
const { t } = usePlaygroundI18n();
import type { WlComponentManifest } from "legato-ui";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import CodePanel from "../design-system/CodePanel.vue";
import { playgroundExample } from "../design-system/example-component";
import ComponentExampleCard from "./ComponentExampleCard.vue";
import { documentationPtSections } from "./components/pt-sections";
import { componentDocumentationAccessibility, documentationExample } from "./components/registry";
import { componentExampleTopics } from "./components/topics";
import DocumentationContract from "./DocumentationContract.vue";
import DocumentationTabs, { type DocumentationTab } from "./DocumentationTabs.vue";
import KeyboardContract from "./KeyboardContract.vue";
const selectedTab = ref<DocumentationTab>("examples");
const prefix = computed(() => "docs-" + props.entry.name.toLowerCase());
const anchors = computed(() => Object.fromEntries(["props", "events", "slots", "pt"].map((key) => [key, prefix.value + "-" + key])));
const primary = computed(() => playgroundExample(props.entry.name));
const topics = computed(() => componentExampleTopics(props.entry.name));
const extra = computed(() => documentationExample(props.entry.name));
const centered = computed(() => [
  "WlAvatar", "WlBadge", "WlButtonGroup", "WlChip", "WlIcon", "WlIconButton",
  "WlLink", "WlPill", "WlSpinner", "WlSwitch", "WlTag"
].includes(props.entry.name));
const accessibility = computed(() => componentDocumentationAccessibility[props.entry.name] ?? []);
const ptSections = computed(() => documentationPtSections[props.entry.name]);
const service = computed(() => props.entry.name === "WlToast" ? "WlToastService" : props.entry.name === "WlConfirmDialog" ? "WlConfirmationService" : undefined);
const setupSource = computed(() => service.value
  ? [
      'import { createApp } from "vue";',
      "import { " + service.value + ' } from "legato-ui";',
      'import App from "./App.vue";',
      "const app = createApp(App);",
      "app.use(" + service.value + ");",
      'app.mount("#app");',
      "",
      t("documentation.strings.s0207") + props.entry.name + ".",
      "// import { " + props.entry.name + ' } from "legato-ui";',
      "// <" + props.entry.name + " />"
    ].join("\n")
  : "");
async function showHeading(id: string): Promise<void> {
  if (!id.startsWith(prefix.value + "-")) return;
  selectedTab.value = id.endsWith("-accessibility")
    ? "accessibility"
    : ["props", "events", "slots", "pt"].some((key) => id === prefix.value + "-" + key) ? "api" : "examples";
  await nextTick();
  document.getElementById(id)?.scrollIntoView({ block: "start" });
}
function restoreHeading(): void {
  try {
    void showHeading(decodeURIComponent(window.location.hash.slice(1)));
  } catch { /* Ignore malformed URL fragments. */ }
}
onMounted(() => {
  restoreHeading();
  window.addEventListener("hashchange", restoreHeading);
});
onBeforeUnmount(() => window.removeEventListener("hashchange", restoreHeading));
defineExpose({ showHeading });
</script>

<template>
  <div class="docs-component-guide wl-stack" data-space="xl" :data-docs-component="entry.name">
    <DocumentationTabs v-model="selectedTab" :id-prefix="prefix" :component-name="entry.name">
      <template #outline><slot name="outline"></slot></template>
    </DocumentationTabs>
    <div
      v-show="selectedTab === 'examples'"
      :id="prefix + '-panel-examples'"
      role="tabpanel"
      :aria-labelledby="prefix + '-tab-examples'"
      class="wl-stack"
      data-space="2xl"
    >
      <ComponentExampleCard
        v-for="(topic, index) in topics"
        :id="prefix + '-' + topic.id"
        :key="topic.id"
        :prefix="prefix"
        :entry="entry"
        :title="t(topic.title)"
        :component="primary.component"
        :load-source="primary.loadSource"
        :topic="topic"
        :primary="index === 0"
        :centered="centered"
      />
      <ComponentExampleCard
        v-if="extra?.component"
        :id="prefix + '-examples'"
        :prefix="prefix"
        :entry="entry"
        :title="extra.title"
        :description="extra.description"
        :component="extra.component"
        :load-source="extra.loadSource"
        additional
      />
      <p v-else class="docs-notice" role="alert">{{ t('documentation.strings.s0210') }}</p>
      <section v-if="service" class="wl-stack" data-space="lg">
        <h2 :id="prefix + '-service'" class="wl-text-heading">{{ t('documentation.strings.s0211') }}</h2>
        <p class="wl-text-body">
          {{ t('documentation.strings.s0212') }} {{ service }} {{ t('documentation.strings.s0213') }}
          {{ entry.name }} {{ t('documentation.strings.s0214') }}
        </p>
        <CodePanel :source="setupSource" :title="t('documentation.strings.s0215')" />
      </section>
    </div>
    <div
      v-show="selectedTab === 'api'"
      :id="prefix + '-panel-api'"
      role="tabpanel"
      :aria-labelledby="prefix + '-tab-api'"
    >
      <DocumentationContract :entry="entry" :anchors="anchors" :pt-sections="ptSections" />
    </div>
    <div
      v-show="selectedTab === 'accessibility'"
      :id="prefix + '-panel-accessibility'"
      role="tabpanel"
      :aria-labelledby="prefix + '-tab-accessibility'"
      class="wl-stack"
      data-space="lg"
    >
      <h2 :id="prefix + '-accessibility'" class="wl-text-heading">{{ t('documentation.strings.s0216') }}</h2>
      <ul class="docs-component-rules"><li v-for="rule in accessibility" :key="rule">{{ rule }}</li></ul>
      <KeyboardContract :name="entry.name" />
      <p v-if="entry.model" class="wl-text-body">
        {{ t('documentation.strings.s0217') }} <code>v-model{{
          entry.model.name === 'modelValue' ? '' : ':' + entry.model.name
        }}</code>{{ t('documentation.strings.s0218') }}
      </p>
      <p class="wl-text-body wl-text-muted">{{ t('documentation.strings.s0219') }}</p>
    </div>
  </div>
</template>

<style>
.docs-component-guide { min-width: 0; }
.docs-component-rules {
  display: grid;
  gap: var(--wl-space-md);
  margin: 0;
  padding-inline-start: var(--wl-space-lg);
  font-size: var(--wl-type-body-size);
  line-height: var(--wl-type-body-line-height);
}
</style>
