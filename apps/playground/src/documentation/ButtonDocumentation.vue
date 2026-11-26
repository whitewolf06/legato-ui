<script setup lang="ts">
import { WlButton, type WlComponentManifest } from "legato-ui";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { ButtonTopic } from "./button/sample";
import { usePlaygroundI18n } from "../i18n";
import ActionPreview from "./button/ActionPreview.vue";
import actionRaw from "./button/ActionPreview.vue?raw";
import ButtonExampleCard from "./button/ButtonExampleCard.vue";
import ButtonForm from "./button/Form.vue";
import formSource from "./button/Form.vue?raw";
import FormPreview from "./button/FormPreview.vue";
import formRaw from "./button/FormPreview.vue?raw";
import IconPreview from "./button/IconPreview.vue";
import iconRaw from "./button/IconPreview.vue?raw";
import ButtonSizes from "./button/Sizes.vue";
import sizesSource from "./button/Sizes.vue?raw";
import ButtonSlots from "./button/Slots.vue";
import slotsSource from "./button/Slots.vue?raw";
import ButtonStates from "./button/States.vue";
import statesSource from "./button/States.vue?raw";
import ButtonVariants from "./button/Variants.vue";
import variantsSource from "./button/Variants.vue?raw";
import { buttonContractAnchors, buttonDocumentationToc, buttonPtSections, buttonDocumentationHeadings as headings } from "./catalog";
import DocumentationContract from "./DocumentationContract.vue";
import DocumentationTabs, { type DocumentationTab } from "./DocumentationTabs.vue";
import KeyboardContract from "./KeyboardContract.vue";

defineProps<{ entry: WlComponentManifest }>();
const { t } = usePlaygroundI18n();
const selectedTab = ref<DocumentationTab>("examples");
const examples: readonly ButtonTopic[] = [
  {
    name: "variants", id: "docs-button-variants", defaults: { variant: "primary", tone: "auto" },
    title: "documentation.strings.s0066", description: "documentation.strings.s0067",
    demo: ActionPreview, raw: actionRaw, comparison: ButtonVariants, comparisonRaw: variantsSource,
    comparisonLabel: "documentation.buttonExamples.compareVariants"
  },
  {
    name: "sizes", id: "docs-button-sizes", defaults: { size: "md", density: "default" },
    title: "documentation.strings.s0068", description: "documentation.strings.s0069",
    demo: ActionPreview, raw: actionRaw, comparison: ButtonSizes, comparisonRaw: sizesSource,
    comparisonLabel: "documentation.buttonExamples.compareSizes"
  },
  {
    name: "states", id: "docs-button-states", defaults: { loading: false, disabled: false },
    title: "documentation.strings.s0070", description: "documentation.strings.s0071",
    demo: ActionPreview, raw: actionRaw, comparison: ButtonStates, comparisonRaw: statesSource,
    comparisonLabel: "documentation.buttonExamples.compareStates"
  },
  {
    name: "slots", id: "docs-button-slot-layout", defaults: { iconPosition: "start" },
    title: "documentation.strings.s0072", description: "documentation.strings.s0073",
    demo: IconPreview, raw: iconRaw, comparison: ButtonSlots, comparisonRaw: slotsSource,
    comparisonLabel: "documentation.buttonExamples.compareIcons"
  },
  {
    name: "form", id: "docs-button-form", defaults: { type: "submit", block: false },
    title: "documentation.strings.s0074", description: "documentation.strings.s0075",
    demo: FormPreview, raw: formRaw, comparison: ButtonForm, comparisonRaw: formSource,
    comparisonLabel: "documentation.buttonExamples.compareForms"
  }
];

async function focusPreview(): Promise<void> {
  selectedTab.value = "examples";
  await nextTick();
  document.getElementById(headings.preview.id)?.querySelector("button")?.focus();
}
async function showHeading(id: string): Promise<void> {
  const tab = buttonDocumentationToc.find((item) => item.id === id)?.tab
    ?? (examples.some((example) => example.id === id) ? "examples" : undefined);
  if (!tab) return;
  selectedTab.value = tab;
  await nextTick();
  document.getElementById(id)?.scrollIntoView({ block: "start" });
}
function restoreHeading(): void {
  let id: string;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  void showHeading(id);
}
onMounted(() => {
  restoreHeading();
  window.addEventListener("hashchange", restoreHeading);
});
onBeforeUnmount(() => {
  window.removeEventListener("hashchange", restoreHeading);
});
defineExpose({ showHeading });
</script>

<template>
  <div class="docs-button wl-stack" data-space="xl" data-docs-component="WlButton">
    <DocumentationTabs
      v-model="selectedTab"
      id-prefix="docs-button"
      component-name="WlButton"
      :label="t('documentation.strings.s0076')"
    >
      <template #outline><slot name="outline"></slot></template>
    </DocumentationTabs>

    <div
      v-show="selectedTab === 'examples'"
      id="docs-button-panel-examples"
      role="tabpanel"
      aria-labelledby="docs-button-tab-examples"
      class="button-topics"
    >
      <ButtonExampleCard
        v-for="example in examples"
        :key="example.name"
        :topic="example"
        :entry="entry"
      />
      <section class="docs-guide wl-stack" data-space="md">
        <h2 :id="headings.usage.id" class="wl-text-heading">{{ headings.usage.title }}</h2>
        <ul class="docs-guide-list">
          <li>
            <strong>primary</strong> {{ t('documentation.strings.s0087') }}
            <strong>secondary</strong> {{ t('documentation.strings.s0088') }}
          </li>
          <li>
            <strong>ghost</strong> {{ t('documentation.strings.s0089') }}
            <strong>link</strong> {{ t('documentation.strings.s0090') }}
          </li>
          <li>
            <strong>block</strong> {{ t('documentation.strings.s0091') }}
            <strong>size</strong> {{ t('documentation.strings.s0089') }}
            <strong>density</strong> {{ t('documentation.strings.s0092') }}
          </li>
        </ul>
        <p class="wl-text-small wl-text-muted">{{ t('documentation.strings.s0093') }} <code>href</code>.</p>
      </section>
    </div>

    <div
      v-show="selectedTab === 'api'"
      id="docs-button-panel-api"
      role="tabpanel"
      aria-labelledby="docs-button-tab-api"
    >
      <DocumentationContract
        :entry="entry"
        :pt-sections="buttonPtSections"
        :anchors="buttonContractAnchors"
        pt-key="button"
      />
    </div>

    <section
      v-show="selectedTab === 'accessibility'"
      id="docs-button-panel-accessibility"
      class="docs-guide wl-stack"
      data-space="lg"
      role="tabpanel"
      tabindex="0"
      aria-labelledby="docs-button-tab-accessibility"
    >
      <h2 :id="headings.accessibility.id" class="wl-text-heading">{{ headings.accessibility.title }}</h2>
      <KeyboardContract name="WlButton" />
      <div><WlButton size="sm" variant="secondary" @click="focusPreview">{{ t('documentation.strings.s0082') }}</WlButton></div>
      <ul class="docs-guide-list">
        <li>{{ t('documentation.strings.s0094') }}</li>
        <li>
          {{ t('documentation.strings.s0095') }} <code>disabled</code> {{ t('documentation.strings.s0096') }}
          <code>loading</code> {{ t('documentation.strings.s0097') }} <code>disabled</code> {{ t('documentation.strings.s0098') }}
        </li>
        <li>
          <code>loading</code> {{ t('documentation.strings.s0099') }}
          <code>aria-busy="true"</code>{{ t('documentation.strings.s0100') }}
          <code>aria-hidden="true"</code>{{ t('documentation.strings.s0101') }}
        </li>
        <li>{{ t('documentation.strings.s0102') }}</li>
        <li>{{ t('documentation.strings.s0103') }} <code>aria-label</code>{{ t('documentation.strings.s0104') }}</li>
        <li>
          {{ t('documentation.strings.s0105') }} <code>type="submit"</code> {{ t('documentation.strings.s0096') }}
          <code>type="reset"</code> {{ t('documentation.strings.s0106') }}
          <code>type="button"</code>{{ t('documentation.strings.s0107') }}
        </li>
      </ul>
      <p class="wl-text-small wl-text-muted">{{ t('documentation.strings.s0108') }}</p>
    </section>
  </div>
</template>

<style>
.docs-button { min-width: 0; }
.button-topics { display: grid; gap: var(--wl-space-2xl); min-width: 0; }
.docs-guide { min-width: 0; }
.docs-guide-list {
  display: grid;
  gap: var(--wl-space-sm);
  margin: 0;
  padding-left: var(--wl-space-lg);
  font-size: var(--wl-type-body-size);
  line-height: var(--wl-type-body-line-height);
}
</style>
