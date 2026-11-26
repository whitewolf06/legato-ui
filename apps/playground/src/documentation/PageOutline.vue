<script setup lang="ts">
import { computed } from "vue";
import type { DocumentationScrollspyHeading } from "./useDocumentationScrollspy";
import { playgroundLocale } from "../i18n";

defineProps<{ headings: readonly DocumentationScrollspyHeading[]; activeId?: string | null }>();
defineEmits<{ follow: [event: MouseEvent, heading: DocumentationScrollspyHeading] }>();
const label = computed(() => playgroundLocale.value === "ru" ? "На этой странице" : "On this page");
</script>

<template>
  <aside class="page-outline">
    <nav :aria-label="label">
      <p class="wl-text-label">{{ label }}</p>
      <ul>
        <li v-for="heading in headings" :key="heading.id">
          <a
            :href="'#' + heading.id"
            :aria-current="activeId === heading.id ? 'location' : undefined"
            @click="$emit('follow', $event, heading)"
          >{{ heading.title }}</a>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.page-outline {
  position: sticky;
  top: var(--wl-playground-header-offset, 80px);
  align-self: start;
  max-block-size: calc(100dvh - var(--wl-playground-header-offset, 80px) - var(--wl-space-xl));
  min-width: 0;
  overflow: auto;
  padding-inline-start: var(--wl-space-lg);
  border-inline-start: 1px solid var(--wl-border);
}
p { margin: 0 0 var(--wl-space-sm); }
ul { margin: 0; padding: 0; list-style: none; }
a {
  position: relative;
  display: block;
  padding-block: var(--wl-space-xs);
  color: var(--wl-text-muted);
  font: var(--wl-type-small-size)/1.5 var(--wl-font);
  text-decoration: none;
  overflow-wrap: anywhere;
}
a:hover { color: var(--wl-text); }
a:focus-visible { outline: 2px solid var(--wl-focus-color); outline-offset: -2px; }
a[aria-current="location"] { color: var(--wl-text-accent); font-weight: var(--wl-type-label-weight); }
a[aria-current="location"]::before {
  content: "";
  position: absolute;
  inset-block: var(--wl-space-xs);
  inset-inline-start: calc(-1 * var(--wl-space-lg));
  border-inline-start: 2px solid var(--wl-text-accent);
}
@media (max-width: 1200px) {
  .page-outline {
    position: static;
    max-block-size: none;
    padding-inline-start: 0;
    border-inline-start: 0;
  }
  ul { display: flex; flex-wrap: wrap; column-gap: var(--wl-space-md); }
  a[aria-current="location"]::before { content: none; }
}
</style>
