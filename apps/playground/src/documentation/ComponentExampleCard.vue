<script setup lang="ts">
import { WlButton, WlCheckbox, type WlComponentManifest, WlInput, WlNumberInput, WlSelect } from "legato-ui";
import { type Component, computed, ref } from "vue";
import type { ComponentExampleTopic } from "./components/topics";
import { consumerSource } from "../design-system/code";
import CodePanel from "../design-system/CodePanel.vue";
import {
  acceptsDocumentationValue,
  createDocumentationControls,
  type DocumentationControl,
  documentationDefaults,
  documentationPresets
} from "../design-system/documentation-controls";
import { type SourceLoader, useLazySource } from "../design-system/lazy-source";
import { usePlaygroundI18n } from "../i18n";
import ExampleFrame from "./ExampleFrame.vue";

const props = defineProps<{
  entry: WlComponentManifest;
  id: string;
  prefix: string;
  title: string;
  description?: string;
  component?: Component;
  loadSource?: SourceLoader;
  topic?: ComponentExampleTopic;
  primary?: boolean;
  additional?: boolean;
  centered?: boolean;
}>();
const { t } = usePlaygroundI18n();
const { source: raw, loading, error, reload } = useLazySource(() => props.loadSource);
const values = ref<Record<string, unknown>>({});
const revision = ref(0);
const preset = ref("default");
const fields = computed(() => {
  if (!props.topic?.controls.length || !raw.value) return [];
  const supported = createDocumentationControls(props.entry, raw.value);
  return props.topic.controls
    .map((name) => supported.find((field) => field.name === name))
    .filter((field): field is DocumentationControl => field !== undefined);
});
const presets = computed(() => props.topic?.presets ? documentationPresets(props.entry) : []);
const defaults = computed(() => documentationDefaults(props.entry, raw.value));
const source = computed(() => consumerSource(raw.value, values.value));
const excerpt = computed(() => {
  if (!props.topic) return undefined;
  const openingTag = "<template>";
  const start = source.value.indexOf(openingTag);
  const end = source.value.lastIndexOf("</template>");
  if (start === -1 || end <= start) return undefined;
  const template = source.value.slice(start + openingTag.length, end).replace(/^\r?\n/, "").trimEnd();
  if (template.split("\n").length > 12) return undefined;
  return template.replace(/^ {2}/gm, "").trimStart();
});

function valueOf(field: DocumentationControl): unknown {
  return Object.prototype.hasOwnProperty.call(values.value, field.name)
    ? values.value[field.name]
    : defaults.value[field.name] ?? field.default;
}
function selectValue(field: DocumentationControl): string | number | undefined {
  const value = valueOf(field);
  return (typeof value === "string" || typeof value === "number")
    && acceptsDocumentationValue(field, value)
    ? value
    : undefined;
}
function textValue(field: DocumentationControl): string {
  const value = valueOf(field);
  return typeof value === "string" ? value : "";
}
function numericValue(field: DocumentationControl): number | undefined {
  const value = valueOf(field);
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function bounds(field: DocumentationControl) {
  const min = values.value.min ?? defaults.value.min;
  const max = values.value.max ?? defaults.value.max;
  return {
    min: field.name === "max" && typeof min === "number" ? min : field.numberMin ?? -1e12,
    max: field.name === "min" && typeof max === "number" ? max : field.numberMax ?? 1e12
  };
}
function setValue(field: DocumentationControl, value: unknown): void {
  if (!acceptsDocumentationValue(field, value)) return;
  if (field.editor === "number") {
    const { min, max } = bounds(field);
    if (typeof value !== "number" || value < min || value > max) return;
  }
  values.value = { ...values.value, [field.name]: value };
}
function initializeNumber(field: DocumentationControl): void {
  const { min, max } = bounds(field);
  setValue(field, Math.max(min, Math.min(max, 0)));
}
function choosePreset(value: unknown): void {
  const selected = presets.value.find((item) => item.id === value);
  if (value !== "default" && !selected) return;
  const editable = Object.fromEntries(Object.entries(values.value).filter(([key]) => props.topic?.controls.includes(key)));
  values.value = { ...editable, ...selected?.props };
  preset.value = selected?.id ?? "default";
}
function reset(): void {
  values.value = {};
  preset.value = "default";
  revision.value++;
}
</script>

<template>
  <section
    class="component-example"
    :data-docs-example="topic?.id ?? 'scenario'"
    :data-docs-component-extra="additional ? entry.name : undefined"
    :aria-labelledby="id"
  >
    <h2 :id="id" class="wl-text-heading">{{ title }}</h2>
    <p v-if="description" class="component-example-intro wl-text-body wl-text-muted">{{ description }}</p>
    <ExampleFrame :data-testid="primary ? 'ds-explorer' : undefined" :data-component="entry.name">
      <div
        v-if="fields.length || presets.length"
        :id="primary ? prefix + '-controls' : undefined"
        class="docs-example-controls"
        role="group"
        :aria-labelledby="id"
      >
        <template v-for="field in fields" :key="field.name">
          <WlCheckbox
            v-if="field.editor === 'checkbox'"
            :model-value="valueOf(field) === true"
            :title="field.description"
            @update:model-value="setValue(field, $event)"
          >{{ field.name }}</WlCheckbox>
          <div v-else class="docs-example-field" :title="field.description">
            <span aria-hidden="true">{{ field.name }}</span>
            <WlInput
              v-if="field.editor === 'text'"
              size="sm"
              :model-value="textValue(field)"
              :type="field.inputType ?? 'text'"
              :aria-label="t('shell.design_system.ComponentExplorer.text380') + field.name"
              @update:model-value="setValue(field, $event)"
            />
            <template v-else-if="field.editor === 'number'">
              <WlNumberInput
                v-if="numericValue(field) !== undefined"
                size="sm"
                :model-value="numericValue(field)!"
                v-bind="bounds(field)"
                :step="field.numberStep ?? 1"
                :aria-label="t('shell.design_system.ComponentExplorer.text382') + field.name"
                @update:model-value="setValue(field, $event)"
              />
              <WlButton
                v-else
                size="sm"
                variant="secondary"
                :aria-label="t('shell.design_system.ComponentExplorer.text384') + field.name"
                @click="initializeNumber(field)"
              >{{ t('shell.design_system.ComponentExplorer.text385') }}</WlButton>
            </template>
            <WlSelect
              v-else
              size="sm"
              :model-value="selectValue(field)"
              :aria-label="t('shell.design_system.ComponentExplorer.text388') + field.name"
              :placeholder="t('documentation.componentExamples.defaultValue')"
              :options="field.editor === 'icon' ? ['', ...(field.values ?? [])].map(value => ({
                label: value === '' ? t('shell.design_system.ComponentExplorer.text374') : String(value), value
              })) : (field.values ?? []).map(value => ({ label: String(value), value }))"
              option-label="label"
              option-value="value"
              @update:model-value="setValue(field, $event)"
            />
          </div>
        </template>
        <WlSelect
          v-if="presets.length"
          size="sm"
          :model-value="preset"
          :aria-label="t('shell.design_system.ComponentExplorer.text394')"
          :options="[
            { label: t('shell.design_system.ComponentExplorer.text395'), value: 'default' },
            ...presets.map(item => ({ label: item.label, value: item.id }))
          ]"
          option-label="label"
          option-value="value"
          @update:model-value="choosePreset"
        />
        <WlButton
          class="docs-example-reset"
          size="sm"
          variant="ghost"
          :aria-label="t('shell.design_system.ComponentExplorer.text377')"
          @click="reset"
        >{{ t('documentation.strings.s0078') }}</WlButton>
      </div>
      <div
        class="docs-example-stage"
        :class="{ 'docs-example-stage--centered': centered }"
        :data-testid="primary ? 'ds-example-preview' : additional ? 'docs-component-extra-preview' : undefined"
        role="group"
        :aria-labelledby="id"
      >
        <component
          :is="component"
          v-if="component"
          :key="revision"
          v-bind="topic ? { preview: values } : {}"
        />
        <p v-else role="alert">{{ t('shell.design_system.ComponentExplorer.text405') }}</p>
      </div>
      <div
        :id="primary ? prefix + '-source' : undefined"
        :data-testid="primary ? 'ds-example-source' : additional ? 'docs-component-extra-source' : undefined"
      >
        <CodePanel
          :source="source"
          :excerpt="excerpt"
          :loading="loading"
          :load-error="Boolean(error)"
          :title="t('documentation.buttonExamples.fullSource')"
          embedded
          @retry="reload"
        />
      </div>
    </ExampleFrame>
  </section>
</template>

<style scoped>
.component-example, .component-example > .docs-example-frame { min-width: 0; }
.component-example h2 { margin: 0 0 var(--wl-space-md); }
.component-example:has(.component-example-intro) h2 { margin-bottom: var(--wl-space-xs); }
.component-example-intro { margin: 0 0 var(--wl-space-md); }
.component-example .docs-example-field { max-width: min(100%, 19rem); }
.component-example .docs-example-field :deep(.wl-input-wrap) { width: 11rem; }
.component-example .docs-example-field :deep(.wl-stepper) { max-width: 9rem; }
.component-example .docs-example-controls > :deep(.wl-select) { width: auto; max-width: 100%; }
</style>
