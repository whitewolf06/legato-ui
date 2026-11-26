<script setup lang="ts">
import { WlAccordion, type WlAccordionItem, WlButton, WlDialog, WlField, WlIcon, WlInput, WlSegmented } from "legato-ui";
import { computed, ref } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";
import { productCopy } from "./content";
import detail from "./lamp-detail.webp";
import evening from "./lamp-evening.webp";
import lamp from "./lamp.webp";

const { locale } = defineProps<ApplicationModuleProps>();
const text = productCopy[locale];
const questions: readonly WlAccordionItem[] = text.questions;
const mode = ref<"work" | "read" | "rest" | null>("read");
const modes = [
  { value: "work", label: text.work, level: 1.22, description: text.workDescription },
  { value: "read", label: text.read, level: 1, description: text.readDescription },
  { value: "rest", label: text.rest, level: 0.64, description: text.restDescription }
] as const;
const selectedMode = computed(() => modes.find(({ value }) => value === mode.value) ?? modes[1]);

const dialog = ref(false);
const email = ref("");
const requestTarget = ref<"intro" | "visit">("intro");
const saved = ref<"intro" | "visit">();

function startRequest(target: "intro" | "visit"): void {
  requestTarget.value = target;
  dialog.value = true;
}

function saveRequest(): void {
  if (!email.value.trim()) return;
  saved.value = requestTarget.value;
  dialog.value = false;
}
</script>

<template>
  <div class="product-demo">
    <header class="product-nav">
      <div class="product-wrap product-nav-inner">
        <a href="#lamp-title" class="product-brand">
          <span class="product-mark" aria-hidden="true"></span>{{ text.brand }}
        </a>
        <nav :aria-label="text.navigation">
          <a href="#lamp-light">{{ text.light }}</a>
          <a href="#lamp-specs">{{ text.specs }}</a>
          <a href="#lamp-faq">{{ text.faqLink }}</a>
          <a v-if="!embedded" :href="applicationRecipesHref(locale)">{{ text.back }}</a>
        </nav>
      </div>
    </header>

    <main>
      <section class="product-wrap product-hero" aria-labelledby="lamp-title">
        <div class="product-intro">
          <p class="product-model">{{ text.collection }}</p>
          <h1 id="lamp-title">{{ text.title }} <span>{{ text.titleAccent }}</span></h1>
          <p class="product-lead">{{ text.intro }}</p>
          <div class="product-actions">
            <WlButton variant="primary" @click="startRequest('intro')">{{ text.action }}</WlButton>
            <WlButton variant="link" href="#lamp-light" icon-position="end">
              {{ text.try }}
              <template #icon><WlIcon name="chevron-down" :size="15" /></template>
            </WlButton>
          </div>
          <p v-if="saved === 'intro'" class="product-feedback wl-text-small" role="status">{{ text.done }}</p>
        </div>
        <figure class="product-hero-image">
          <img
            :src="lamp"
            :alt="text.picture"
            width="960"
            height="720"
            fetchpriority="high"
          />
          <figcaption><span aria-hidden="true"></span>{{ text.finish }}</figcaption>
        </figure>
      </section>

      <dl class="product-wrap product-facts" :aria-label="text.specs">
        <div v-for="[value, label] in text.facts" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>

      <section id="lamp-light" class="product-wrap product-section" aria-labelledby="lamp-light-heading">
        <div class="product-light" data-wl-theme="legato-dark">
          <div class="product-light-copy">
            <h2 id="lamp-light-heading">{{ text.lightTitle }}</h2>
            <p>{{ text.lightIntro }}</p>
            <WlSegmented v-model="mode" :options="modes" :aria-label="text.brightness" />
            <p class="product-mode-description" aria-live="polite">{{ selectedMode.description }}</p>
          </div>
          <div class="product-light-image">
            <img
              :src="evening"
              :alt="text.eveningPicture"
              :style="{ '--wl-lamp-exposure': selectedMode.level }"
              width="1320"
              height="880"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section class="product-wrap product-section product-materials" aria-labelledby="lamp-materials-heading">
        <img
          :src="detail"
          :alt="text.detailPicture"
          width="840"
          height="840"
          loading="lazy"
        />
        <div>
          <h2 id="lamp-materials-heading">{{ text.materialsTitle }}</h2>
          <p class="product-section-lead">{{ text.materialsIntro }}</p>
          <dl class="product-detail-list">
            <div v-for="item in text.details" :key="item.title">
              <dt><WlIcon :name="item.icon" :size="19" />{{ item.title }}</dt>
              <dd>{{ item.description }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="lamp-specs" class="product-specs product-section" aria-labelledby="lamp-specs-heading">
        <div class="product-wrap product-specs-inner">
          <div>
            <h2 id="lamp-specs-heading">{{ text.specs }}</h2>
            <p class="product-section-lead">{{ text.specsIntro }}</p>
          </div>
          <dl class="product-specs-list">
            <div v-for="[label, value] in text.specsList" :key="label">
              <dt>{{ label }}</dt><dd>{{ value }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="lamp-faq" class="product-wrap product-section product-specs-inner" aria-labelledby="lamp-faq-heading">
        <div>
          <h2 id="lamp-faq-heading">{{ text.faq }}</h2>
          <p class="product-section-lead">{{ text.faqIntro }}</p>
        </div>
        <WlAccordion :items="questions" single />
      </section>

      <section class="product-wrap product-section" aria-labelledby="lamp-visit-heading">
        <div class="product-visit">
          <div>
            <h2 id="lamp-visit-heading">{{ text.visit }}</h2>
            <p>{{ text.visitDescription }}</p>
          </div>
          <div>
            <WlButton variant="primary" @click="startRequest('visit')">{{ text.action }}</WlButton>
            <p v-if="saved === 'visit'" class="product-feedback wl-text-small" role="status">{{ text.done }}</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="product-footer">
      <div class="product-wrap product-nav-inner">
        <span class="product-brand"><span class="product-mark" aria-hidden="true"></span>{{ text.brand }}</span>
        <a class="demo-return" href="#lamp-title">{{ text.top }} <WlIcon name="arrow-up" :size="15" /></a>
      </div>
    </footer>

    <WlDialog v-model:visible="dialog" :header="text.action" size="sm">
      <form class="demo-dialog-form wl-stack" data-space="md" @submit.prevent="saveRequest">
        <p class="wl-text-muted">{{ text.formHint }}</p>
        <WlField :label="text.email" required>
          <template #default="{ id }"><WlInput
            :id="id"
            v-model="email"
            type="email"
            autocomplete="email"
            required
          /></template>
        </WlField>
        <div><WlButton variant="primary" type="submit">{{ text.send }}</WlButton></div>
      </form>
    </WlDialog>
  </div>
</template>

<style scoped src="./product.css"></style>
