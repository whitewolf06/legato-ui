<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import type { DocumentationGuideSection } from "../navigation";
import CodePanel from "../design-system/CodePanel.vue";
import { playgroundLocale } from "../i18n";
import { gaviaProjectInfo } from "../project/project-info";
import { documentationGuide, documentationGuideHeadingId } from "./guides";
import InstallationCommand from "./InstallationCommand.vue";
const props = defineProps<{ section: DocumentationGuideSection }>();
const guide = computed(() => documentationGuide(props.section, playgroundLocale.value));
const ApplicationExampleGallery = defineAsyncComponent(() => import("../application-examples/ApplicationExampleGallery.vue"));
const RecipeGallery = defineAsyncComponent(() => import("../design-system/RecipeGallery.vue"));
const guideSourcePaths: Record<DocumentationGuideSection, string> = {
  installation: "docs/guide/getting-started.md",
  why: "examples",
  theming: "docs/guide/theming.md",
  recipes: "docs/architecture.md",
  accessibility: "docs/maintainers/quality.md",
  "how-it-is-built": "docs/architecture.md"
};
const sourceHref = computed(() => {
  const base = props.section === "why" ? gaviaProjectInfo.repositoryUrl + "/tree/main/" : gaviaProjectInfo.documentationBaseUrl;
  return base + guideSourcePaths[props.section];
});
</script>

<template>
  <div class="wl-stack" data-space="xl" :data-guide="section">
    <template v-if="section === 'recipes'">
      <section class="wl-stack" data-space="md" aria-labelledby="recipe-applications">
        <h2 id="recipe-applications" class="wl-text-heading">
          {{ playgroundLocale === "ru" ? "Примеры проектов" : "Example projects" }}
        </h2>
        <ApplicationExampleGallery />
      </section>
      <section class="wl-stack" data-space="md" aria-labelledby="recipe-simple">
        <h2 id="recipe-simple" class="wl-text-heading">{{ playgroundLocale === "ru" ? "Простые примеры" : "Simple examples" }}</h2>
        <RecipeGallery />
      </section>
    </template>
    <section
      v-for="(entry, index) in guide.sections"
      :key="documentationGuideHeadingId(section, entry, index)"
      class="wl-stack"
      data-space="md"
    >
      <h2 :id="documentationGuideHeadingId(section, entry, index)" class="wl-text-heading">{{ entry.title }}</h2>
      <p class="wl-text-body">{{ entry.text }}</p>
      <InstallationCommand v-if="section === 'installation' && entry.id === 'install-package'" />
      <CodePanel v-else-if="entry.code" :source="entry.code" :expanded="true" />
    </section>
    <a v-if="section === 'accessibility'" class="docs-text-link" href="https://www.w3.org/WAI/ARIA/apg/patterns/">WAI-ARIA Authoring Practices</a>
    <a class="docs-text-link" :href="sourceHref">{{ playgroundLocale === 'ru' ? 'Исходники и руководство' : 'Source and guide' }}</a>
  </div>
</template>
