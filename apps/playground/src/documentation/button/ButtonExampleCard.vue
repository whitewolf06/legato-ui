<script setup lang="ts">
import { WlButton, WlCheckbox, type WlComponentManifest, WlSelect } from "legato-ui";
import { computed, ref } from "vue";
import { consumerSource } from "../../design-system/code";
import CodePanel from "../../design-system/CodePanel.vue";
import { usePlaygroundI18n } from "../../i18n";
import ExampleFrame from "../ExampleFrame.vue";
import { buttonSample, type ButtonTopic } from "./sample";

const props = defineProps<{ topic: ButtonTopic; entry: WlComponentManifest }>();
const { t } = usePlaygroundI18n();
const values = ref({ ...props.topic.defaults });
const revision = ref(0);
const comparisonReady = ref(false);
const first = computed(() => props.topic.name === "variants");
const fields = computed(() => Object.entries(props.topic.defaults).map(([name, initial]) => {
  const definition = props.entry.props.find((prop) => prop.name === name);
  const choices = name === "iconPosition" ? ["start", "end"] : (definition?.values ?? []).map(String);
  const options = choices.map((value) => ({ label: value, value }));
  if (name === "tone") options.unshift({ label: t("documentation.buttonExamples.autoTone"), value: "auto" });
  return { name, toggle: typeof initial === "boolean", options };
}));
const bindings = computed(() => Object.fromEntries(Object.entries(values.value).filter(([name, value]) => name !== "tone" || value !== "auto")));
const code = computed(() => buttonSample(props.topic.raw, bindings.value));
const comparisonCode = computed(() => consumerSource(props.topic.comparisonRaw));

function reset(): void {
  values.value = { ...props.topic.defaults };
  revision.value++;
}
</script>

<template>
  <section class="button-topic" :aria-labelledby="topic.id" :data-docs-button-example="topic.name">
    <h2 :id="topic.id" class="wl-text-heading" :data-testid="'docs-button-example-heading-' + topic.name">{{ t(topic.title) }}</h2>
    <p class="button-topic-intro wl-text-body wl-text-muted">{{ t(topic.description) }}</p>
    <ExampleFrame class="button-sample">
      <div
        :id="first ? 'docs-button-controls-title' : undefined"
        class="button-sample-controls docs-example-controls"
        role="group"
        :aria-labelledby="topic.id"
      >
        <template v-for="field in fields" :key="field.name">
          <WlCheckbox
            v-if="field.toggle"
            :model-value="values[field.name] === true"
            :data-testid="'docs-control-' + field.name"
            @update:model-value="values[field.name] = $event"
          >{{ field.name }}</WlCheckbox>
          <div v-else class="docs-example-field">
            <span :id="'button-field-' + field.name">{{ field.name }}</span>
            <WlSelect
              size="sm"
              :aria-labelledby="'button-field-' + field.name"
              :data-testid="'docs-control-' + field.name"
              :model-value="String(values[field.name])"
              :options="field.options"
              option-label="label"
              option-value="value"
              @update:model-value="typeof $event === 'string' && (values[field.name] = $event)"
            />
          </div>
        </template>
        <WlButton
          class="docs-example-reset"
          variant="ghost"
          size="sm"
          @click="reset"
        >{{ t('documentation.strings.s0078') }}</WlButton>
      </div>
      <div
        :id="first ? 'docs-button-preview-title' : undefined"
        class="button-sample-stage docs-example-stage docs-example-stage--centered"
        :data-testid="first ? 'docs-button-preview' : undefined"
        role="group"
        :aria-label="t(topic.title)"
      >
        <component :is="topic.demo" :key="revision" :preview="bindings" />
      </div>
      <div :id="first ? 'docs-button-source-title' : undefined" :data-testid="first ? 'docs-button-source' : undefined">
        <CodePanel :source="code.source" :excerpt="code.snippet" :title="t('documentation.buttonExamples.fullSource')" />
      </div>
    </ExampleFrame>
    <details class="button-topic-comparison" @toggle.once="comparisonReady = true">
      <summary>{{ t(topic.comparisonLabel) }}</summary>
      <div v-if="comparisonReady" class="button-comparison-body wl-stack" data-space="md">
        <div data-testid="docs-button-example-preview" role="region" :aria-label="t(topic.comparisonLabel)">
          <component :is="topic.comparison" />
        </div>
        <div data-testid="docs-button-example-source"><CodePanel :source="comparisonCode" :title="t('documentation.strings.s0002')" /></div>
      </div>
    </details>
  </section>
</template>

<style scoped>
.button-topic { min-width: 0; }
.button-topic h2 { margin: 0; }
.button-topic-intro { margin: var(--wl-space-xs) 0 var(--wl-space-md); }
.button-sample-stage { text-align: center; }
.button-sample-stage > :deep(*) { width: min(100%, 24rem); }
.button-sample-stage :deep(p) { margin: var(--wl-space-sm) 0 0; }
.button-topic-comparison { margin-top: var(--wl-space-sm); }
.button-topic-comparison > summary {
  width: fit-content;
  max-width: 100%;
  padding-block: var(--wl-space-xs);
  font-size: var(--wl-type-small-size);
  color: var(--wl-text-accent);
  cursor: pointer;
}
.button-topic-comparison > summary:focus-visible { outline: 2px solid var(--wl-focus-color); outline-offset: 2px; }
.button-comparison-body {
  margin-top: var(--wl-space-sm);
  padding-inline-start: var(--wl-space-md);
  border-inline-start: 2px solid var(--wl-border);
}
</style>
