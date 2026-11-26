<script setup lang="ts">
import { usePlaygroundI18n } from "../i18n";
const props = defineProps<{
  source: string;
  excerpt?: string;
  title?: string;
  expanded?: boolean;
  embedded?: boolean;
  language?: CodeLanguage;
  loading?: boolean;
  loadError?: boolean;
}>();
defineEmits<{ retry: [] }>();
const { t } = usePlaygroundI18n();
import { WlButton, WlIcon } from "legato-ui";
import { useWlClipboard } from "legato-ui/composables";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { CodeLanguage } from "./highlighting/tokenizer";
import { gaviaProjectInfo } from "../project/project-info";
import CodeHighlight from "./CodeHighlight.vue";
import { stackBlitzFields } from "./stackblitz";
const clipboard = useWlClipboard();
const copiedSource = ref<string>();
const fullOpen = ref(!!props.expanded);
const visibleSource = computed(() => props.excerpt && !fullOpen.value ? props.excerpt : props.source);
const copied = computed(() => clipboard.copied.value && copiedSource.value === visibleSource.value);
const pending = ref(false);
const manual = ref(false);
let copyRevision = 0;
let disposed = false;
const runnable = computed(() => /<template[\s>]/.test(props.source) && /from ["']legato-ui["']/.test(props.source));
const sandboxFields = computed(() => runnable.value
  ? stackBlitzFields(props.source, gaviaProjectInfo.publishedVersion, gaviaProjectInfo.publishedName)
  : {});
watch(visibleSource, () => {
  copyRevision++;
  copiedSource.value = undefined;
  pending.value = false;
  manual.value = false;
});
onBeforeUnmount(() => {
  disposed = true;
  copyRevision++;
});
async function copy(): Promise<void> {
  if (props.loading || props.loadError || disposed) return;
  const revision = ++copyRevision;
  pending.value = true;
  copiedSource.value = undefined;
  manual.value = false;
  const source = visibleSource.value;
  const success = await clipboard.copy(source);
  if (disposed || revision !== copyRevision) return;
  copiedSource.value = success ? source : undefined;
  manual.value = !success;
  pending.value = false;
}
defineExpose({ copy });
</script>

<template>
  <div class="ds-source wl-stack" :class="{ 'ds-source--embedded': embedded || excerpt }" data-space="sm">
    <form
      v-if="runnable"
      method="post"
      action="https://stackblitz.com/run?file=src%2FApp.vue"
      target="_blank"
      rel="noopener noreferrer"
    >
      <input
        v-for="(value, name) in sandboxFields"
        :key="name"
        type="hidden"
        :name="name"
        :value="value"
      />
      <WlButton
        size="sm"
        variant="ghost"
        type="submit"
        icon-position="end"
        :disabled="loading || loadError"
      >
        {{ embedded || excerpt ? 'StackBlitz' : 'Open in StackBlitz' }}
        <template #icon><WlIcon name="arrow-up-right" :size="14" /></template>
      </WlButton>
    </form>
    <div class="ds-source-frame">
      <details :open="expanded" @toggle="fullOpen = ($event.currentTarget as HTMLDetailsElement).open">
        <summary class="ds-source-summary">{{ title ?? t('shell.design_system.CodePanel.text365') }}</summary>
        <pre
          v-if="!excerpt || fullOpen"
          class="ds-source-code"
          tabindex="0"
          role="region"
          :aria-label="title ?? t('shell.design_system.CodePanel.text366')"
        ><CodeHighlight :source="source" :language="language" /></pre>
      </details>
      <pre
        v-if="excerpt && !fullOpen"
        class="ds-source-code"
        tabindex="0"
        role="region"
        :aria-label="t('shell.design_system.CodePanel.text366')"
      ><CodeHighlight :source="excerpt" :language="language" /></pre>
      <!-- Keep copy reachable when details are collapsed; the button belongs to the code frame. -->
      <div class="ds-source-copy" :class="{ 'is-pending': pending }">
        <WlButton
          class="ds-source-copy-button"
          size="sm"
          variant="ghost"
          :loading="pending"
          :disabled="loading || loadError"
          :aria-label="copied ? t('shell.design_system.CodePanel.text367') : t('shell.design_system.CodePanel.text368')"
          :title="copied ? t('shell.design_system.CodePanel.text369') : t('shell.design_system.CodePanel.text370')"
          @click="copy"
        >
          <template #icon><WlIcon :name="copied ? 'check' : 'copy'" :size="16" /></template>
        </WlButton>
      </div>
    </div>
    <span class="wl-text-small wl-text-muted" role="status">{{
      loading ? t('shell.code.loading') : loadError ? t('shell.code.error')
        : copied ? t('shell.design_system.CodePanel.text371') : manual ? t('shell.design_system.CodePanel.text372') : ''
    }}</span>
    <WlButton
      v-if="loadError"
      size="sm"
      variant="ghost"
      @click="$emit('retry')"
    >{{ t('shell.code.retry') }}</WlButton>
    <textarea
      v-if="manual"
      class="ds-source-manual"
      readonly
      :value="visibleSource"
      :aria-label="t('shell.design_system.CodePanel.text373')"
      @focus="($event.target as HTMLTextAreaElement).select()"
    ></textarea>
  </div>
</template>

<style>
.ds-source { min-width: 0; }
.ds-source-frame {
  position: relative;
  min-width: 0;
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-surface);
  background: var(--wl-bg-soft);
}
.ds-source-summary {
  cursor: pointer;
  color: var(--wl-text-muted);
  padding: var(--wl-space-md) var(--wl-space-lg);
  padding-inline-end: calc(var(--wl-control-height-sm) + var(--wl-space-lg));
  min-height: calc(var(--wl-control-height-sm) + var(--wl-space-md));
  font-size: var(--wl-type-small-size);
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.ds-source-code {
  margin: 0;
  padding: var(--wl-space-sm) var(--wl-space-lg) var(--wl-space-lg);
  color: var(--wl-text);
  overflow: auto;
  max-height: 480px;
  white-space: pre;
  tab-size: 2;
}
.ds-source-code, .ds-source-manual {
  font-family: "Cascadia Code", "SFMono-Regular", "Cascadia Mono", Consolas, Menlo, "Liberation Mono", var(--wl-mono), monospace;
  font-size: 13px;
  line-height: 1.7;
  font-variant-ligatures: none;
  letter-spacing: 0;
}
.ds-source-code:focus-visible, .ds-source-summary:focus-visible, .ds-source-manual:focus-visible {
  outline: 2px solid var(--wl-focus-color);
  outline-offset: 2px;
}
.ds-source-copy {
  position: absolute;
  inset-block-start: var(--wl-space-xs);
  inset-inline-end: var(--wl-space-xs);
  opacity: 1;
  transition: opacity 120ms ease;
}
.ds-source-copy-button { width: var(--wl-control-height-sm); padding: 0; background: var(--wl-bg-soft); color: var(--wl-text-muted); }
.ds-source-copy-button:hover { color: var(--wl-text); background: var(--wl-bg-hover); }
.ds-source-manual {
  width: 100%;
  min-height: 180px;
  background: var(--wl-bg);
  color: var(--wl-text);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-control);
  padding: var(--wl-space-md);
}
@media (hover: hover) and (pointer: fine) {
  .ds-source-copy { opacity: 0; pointer-events: none; }
  .ds-source-frame:hover .ds-source-copy, .ds-source-frame:focus-within .ds-source-copy, .ds-source-copy.is-pending {
    opacity: 1;
    pointer-events: auto;
  }
}
@media (hover: none), (pointer: coarse), (any-pointer: coarse) { .ds-source-copy { opacity: 1; pointer-events: auto; } }
@media (prefers-reduced-motion: reduce) { .ds-source-copy { transition: none; } }
.ds-source--embedded {
  position: relative;
  display: block;
  border-top: 1px solid var(--wl-border);
  border-radius: 0 0 var(--wl-corner-surface) var(--wl-corner-surface);
  background: color-mix(in srgb, var(--wl-bg-soft) 48%, var(--wl-bg));
}
.ds-source--embedded .ds-source-frame { border: 0; border-radius: inherit; background: transparent; }
.ds-source--embedded .ds-source-summary {
  display: list-item;
  width: fit-content;
  max-width: calc(100% - 9rem);
  min-height: calc(var(--wl-control-height-sm) + var(--wl-space-sm));
  padding: var(--wl-space-sm) 0 var(--wl-space-xs);
  margin-inline-start: var(--wl-space-md);
  font-size: var(--wl-type-small-size);
}
.ds-source--embedded > form {
  position: absolute;
  inset-block-start: var(--wl-space-xs);
  inset-inline-end: calc(var(--wl-control-height-sm) + var(--wl-space-sm));
  z-index: 1;
}
.ds-source--embedded > form button { padding-inline: var(--wl-space-xs); color: var(--wl-text-muted); }
.ds-source--embedded .ds-source-copy { opacity: 1; pointer-events: auto; }
.ds-source--embedded .ds-source-copy-button { background: transparent; }
.ds-source--embedded .ds-source-code { padding: var(--wl-space-xs) var(--wl-space-md) var(--wl-space-md); }
.ds-source--embedded > [role="status"] { display: block; }
.ds-source--embedded > [role="status"]:not(:empty) { padding: 0 var(--wl-space-md) var(--wl-space-sm); }
@media (max-width: 640px) {
  .ds-source--embedded .ds-source-frame > pre { white-space: pre-wrap; overflow-wrap: anywhere; }
}
</style>
