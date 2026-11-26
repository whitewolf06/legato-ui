<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import { playgroundLocale } from "../i18n";
import { playgroundNavigationKey } from "../playground-navigation";
import {
  applicationEscapeEvent, type ApplicationExample, applicationExampleHref, applicationExamples,
  applicationLocationEvent, applicationThemeEvent, projectPreviewBase, projectPreviewHref
} from "./catalog";

const navigation = inject(playgroundNavigationKey, undefined);
const theme = computed(() => navigation?.theme.value ?? "legato");
const dark = computed(() => ["legato-dark", "gavia-dark", "graphite"].includes(theme.value));
const dialog = ref<HTMLDialogElement>();
const frame = ref<HTMLIFrameElement>();
const active = ref<ApplicationExample>();
const initialTheme = ref(theme.value);
const openTarget = ref<{ view?: string; order?: string }>({});
const previewWidth = ref<"desktop" | "phone">("desktop");
let opener: HTMLElement | undefined;

const copy = computed(() => playgroundLocale.value === "ru"
  ? {
      group: "Примеры проектов", demo: "Демонстрация", standalone: "Открыть отдельно",
      width: "Ширина предпросмотра", desktop: "Десктоп", phone: "Телефон", close: "Закрыть"
    }
  : {
      group: "Example projects", demo: "Demo", standalone: "Open separately",
      width: "Preview width", desktop: "Desktop", phone: "Phone", close: "Close"
    });
const source = computed(() => active.value
  ? applicationExampleHref(active.value.id, playgroundLocale.value, { theme: initialTheme.value })
  : undefined);
const standalone = computed(() => active.value
  ? applicationExampleHref(active.value.id, playgroundLocale.value, openTarget.value)
  : undefined);

function show(event: MouseEvent, example: ApplicationExample): void {
  const panel = dialog.value;
  if (!panel || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (active.value?.id !== example.id) {
    active.value = example;
    initialTheme.value = theme.value;
    openTarget.value = {};
    previewWidth.value = "desktop";
  }
  opener = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
  panel.showModal();
  panel.querySelector<HTMLButtonElement>("[data-project-close]")?.focus();
}

function restoreFocus(): void {
  opener?.focus({ preventScroll: true });
  opener = undefined;
}

function syncTheme(): void {
  frame.value?.contentWindow?.postMessage({ type: applicationThemeEvent, theme: theme.value }, window.location.origin);
}

function receive(event: MessageEvent<unknown>): void {
  if (event.origin !== location.origin || event.source !== frame.value?.contentWindow || !event.data || typeof event.data !== "object") return;
  const { type, app, view, order } = event.data as { type?: unknown; app?: unknown; view?: unknown; order?: unknown };
  if (type === applicationLocationEvent && app === active.value?.id) {
    openTarget.value = {
      ...(typeof view === "string" ? { view } : {}),
      ...(typeof order === "string" ? { order } : {})
    };
  }
  if (type === applicationEscapeEvent && dialog.value?.open) dialog.value.close();
}

watch(theme, syncTheme);
watch(playgroundLocale, () => {
  openTarget.value = {};
});
onMounted(() => window.addEventListener("message", receive));
onUnmounted(() => window.removeEventListener("message", receive));
</script>

<template>
  <div data-testid="application-examples" data-project-gallery>
    <link rel="stylesheet" :href="projectPreviewBase + 'gallery.css'" />
    <nav class="project-gallery-nav" :aria-label="copy.group">
      <div class="project-gallery-grid">
        <a
          v-for="example in applicationExamples"
          :key="example.id"
          class="project-gallery-card"
          :href="applicationExampleHref(example.id, playgroundLocale)"
          aria-haspopup="dialog"
          @click="show($event, example)"
        >
          <img
            :src="projectPreviewHref(example.id, dark)"
            alt=""
            width="720"
            height="432"
            loading="lazy"
          />
          <div class="project-gallery-card-body">
            <strong>{{ example[playgroundLocale].title }}</strong>
            <span class="project-gallery-arrow" aria-hidden="true">↗</span>
            <p>{{ example[playgroundLocale].description }}</p>
          </div>
        </a>
      </div>
    </nav>
    <dialog
      ref="dialog"
      class="project-preview"
      aria-labelledby="project-preview-title"
      closedby="any"
      @close="restoreFocus"
    >
      <header class="project-preview-header">
        <div class="project-preview-title">
          <span class="project-preview-tag">{{ copy.demo }}</span>
          <h3 id="project-preview-title">{{ active?.[playgroundLocale].title }}</h3>
        </div>
        <div class="project-preview-actions">
          <fieldset class="project-preview-widths">
            <legend class="wl-visually-hidden">{{ copy.width }}</legend>
            <label>
              <input
                v-model="previewWidth"
                class="wl-visually-hidden"
                type="radio"
                name="project-preview-width"
                value="desktop"
              />
              <span>{{ copy.desktop }}</span>
            </label>
            <label>
              <input
                v-model="previewWidth"
                class="wl-visually-hidden"
                type="radio"
                name="project-preview-width"
                value="phone"
              />
              <span>{{ copy.phone }}</span>
            </label>
          </fieldset>
          <a :href="standalone" target="_blank" rel="noopener">{{ copy.standalone }}</a>
        </div>
        <button
          type="button"
          class="project-preview-close"
          data-project-close
          :aria-label="copy.close"
          :title="copy.close"
          @click="dialog?.close()"
        >
          <span class="project-preview-close-icon" aria-hidden="true"></span>
        </button>
      </header>
      <div class="project-preview-stage">
        <iframe
          v-if="active"
          :key="active.id + '-' + playgroundLocale"
          ref="frame"
          class="project-preview-frame"
          :class="{ 'project-preview-frame--phone': previewWidth === 'phone' }"
          :src="source"
          :title="active[playgroundLocale].title"
          @load="syncTheme"
        ></iframe>
      </div>
    </dialog>
  </div>
</template>
