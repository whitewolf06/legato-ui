<script setup lang="ts">
import { WlButton, WlCheckbox, type WlComponentManifest, WlSelect } from "legato-ui";
import { computed, nextTick, ref, watch } from "vue";
import { usePlaygroundI18n } from "../i18n";
import { consumerSource } from "./code";
import CodePanel from "./CodePanel.vue";
import { documentationDefaults } from "./documentation-controls";
import { playgroundExample } from "./example-component";
import { useLazySource } from "./lazy-source";
import { stateCases, stateControls } from "./states";

const props = defineProps<{ entry: WlComponentManifest }>();
const { t } = usePlaygroundI18n();
const example = computed(() => playgroundExample(props.entry.name));
const { source: raw, loading, error, reload } = useLazySource(() => example.value.loadSource);
const controls = computed(() => stateControls(props.entry));
const defaults = computed(() => documentationDefaults(props.entry, raw.value));
const cases = computed(() => stateCases(props.entry));
const overrides = ref<Record<string, unknown>>({});
const source = computed(() => consumerSource(raw.value, overrides.value));
const revision = ref(0);
const preview = ref<HTMLElement | null>(null);
const focused = ref(false);
const hovered = ref(false);
const missingFocusTarget = ref(false);

function controlValue(name: string, fallback?: unknown): unknown {
  return Object.prototype.hasOwnProperty.call(overrides.value, name) ? overrides.value[name] : defaults.value[name] ?? fallback;
}
function selectValue(name: string, choices: readonly (string | number)[], fallback: unknown) {
  return choices.find((value) => Object.is(value, controlValue(name, fallback ?? choices[0])));
}
function focusOut(event: FocusEvent): void {
  focused.value = event.relatedTarget instanceof Node && Boolean(preview.value?.contains(event.relatedTarget));
}
function chooseCase(value: Record<string, unknown>): void {
  overrides.value = { ...value };
  revision.value++;
}
function reset(): void {
  chooseCase({});
  focused.value = false;
  hovered.value = false;
  missingFocusTarget.value = false;
}
watch(() => props.entry.name, reset);
async function focusPreview(): Promise<void> {
  await nextTick();
  const candidates = preview.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]:not([aria-disabled="true"]), a[href]');
  const target = Array.from(candidates ?? []).find((element) => element.getClientRects().length > 0 && !element.closest('[hidden], [inert], [aria-hidden="true"]') && getComputedStyle(element).visibility !== "hidden");
  missingFocusTarget.value = !target;
  target?.focus({ preventScroll: true });
}
</script>

<template>
  <div
    class="ds-explorer wl-stack"
    data-space="lg"
    data-testid="ds-explorer"
    :data-component="entry.name"
  >
    <section class="ds-explorer-settings wl-stack" data-space="lg">
      <div class="wl-inline" data-space="md">
        <h4 class="wl-text-subheading">{{ t('shell.design_system.ComponentExplorer.text376') }}</h4>
        <WlButton
          size="sm"
          variant="ghost"
          :aria-label="t('shell.design_system.ComponentExplorer.text377')"
          @click="reset"
        >{{ t('shell.design_system.ComponentExplorer.text379') }}</WlButton>
      </div>
      <div v-if="controls.length" class="ds-explorer-controls">
        <div
          v-for="control in controls"
          :key="control.name"
          class="ds-explorer-control wl-stack"
          data-space="xs"
        >
          <WlCheckbox
            v-if="control.type === 'boolean'"
            :model-value="Boolean(controlValue(control.name, control.default))"
            @update:model-value="overrides[control.name] = $event"
          >{{ control.name }}</WlCheckbox>
          <template v-else>
            <span class="wl-text-small">{{ control.name }}</span>
            <WlSelect
              :model-value="selectValue(control.name, control.values ?? [], control.default)"
              :aria-label="t('shell.design_system.ComponentExplorer.text388') + control.name"
              :options="[...(control.values ?? [])]"
              @update:model-value="control.values?.includes($event as string | number) && (overrides[control.name] = $event)"
            />
          </template>
        </div>
      </div>
    </section>
    <div class="ds-explorer-output wl-stack" data-space="lg">
      <section class="wl-stack" data-space="lg">
        <!-- This boundary only observes the existing demo's hover/focus state. -->
        <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
        <div
          ref="preview"
          class="ds-example-preview"
          data-testid="ds-example-preview"
          @focusin="focused = true"
          @focusout="focusOut"
          @mouseenter="hovered = true"
          @mouseleave="hovered = false"
        >
          <component
            :is="example.component"
            v-if="example.component"
            :key="entry.name + '-' + revision"
            :preview="overrides"
          />
          <p v-else role="alert">{{ t('shell.design_system.ComponentExplorer.text405') }}</p>
        </div>
        <div class="wl-inline" data-space="sm">
          <WlButton size="sm" variant="ghost" @click="focusPreview">{{ t('shell.design_system.ComponentExplorer.text406') }}</WlButton>
          <span class="wl-text-small wl-text-muted" role="status">
            {{ missingFocusTarget ? t('shell.design_system.ComponentExplorer.text407')
              : t('shell.design_system.ComponentExplorer.text408')
                + (focused ? t('shell.design_system.ComponentExplorer.text409')
                  : t('shell.design_system.ComponentExplorer.text410'))
                + t('shell.design_system.ComponentExplorer.text411')
                + (hovered ? t('shell.design_system.ComponentExplorer.text412')
                  : t('shell.design_system.ComponentExplorer.text413')) }}
          </span>
        </div>
        <p class="wl-text-small wl-text-muted">
          {{ t('shell.design_system.ComponentExplorer.text414') }}
          {{ t('shell.design_system.ComponentExplorer.text416') }} {{ t('shell.design_system.ComponentExplorer.text417') }}
        </p>
      </section>
      <details class="ds-state-matrix">
        <summary>{{ t('shell.design_system.ComponentExplorer.text420') }} {{ cases.length }}</summary>
        <div class="wl-inline" data-space="sm"><WlButton
          v-for="item in cases"
          :key="item.id"
          size="sm"
          variant="secondary"
          :data-case="item.id"
          @click="chooseCase(item.props)"
        >{{ item.label }}</WlButton></div>
      </details>
      <p v-if="entry.name === 'WlToast' || entry.name === 'WlConfirmDialog'" class="wl-text-small wl-text-muted">
        {{ t('shell.design_system.ComponentExplorer.text421') }}
      </p>
      <CodePanel
        :source="source"
        :loading="loading"
        :load-error="Boolean(error)"
        @retry="reload"
      />
    </div>
  </div>
</template>

<style>
.ds-explorer-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--wl-space-md);
  align-items: end;
}
.ds-example-preview {
  min-width: 0;
  padding: var(--wl-space-lg);
  background: var(--wl-bg);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-surface);
  overflow-wrap: anywhere;
}
.ds-state-matrix { font-size: var(--wl-type-small-size); }
.ds-state-matrix summary { cursor: pointer; padding-block: var(--wl-space-sm); color: var(--wl-text-muted); }
.ds-state-matrix > div { padding-top: var(--wl-space-sm); }
.ds-explorer-control, .ds-explorer-settings, .ds-explorer-output { min-width: 0; }
</style>
