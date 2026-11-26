<script setup lang="ts">
import { WlButton, WlDialog, WlIcon, WlSegmented } from "legato-ui";
import { computed, ref } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";
import { portfolioCopy, portfolioProjects, type ProjectType } from "./content";

const { locale } = defineProps<ApplicationModuleProps>();
const copy = portfolioCopy[locale];
const filters = [
  { value: "all", label: copy.all },
  { value: "architecture", label: copy.architecture },
  { value: "interiors", label: copy.interiors }
] as const;
const filter = ref<ProjectType | "all" | null>("all");
const projects = computed(() => portfolioProjects.filter(({ type }) => filter.value === "all" || type === filter.value));
const featured = portfolioProjects[0];
const project = ref<typeof portfolioProjects[number]>(featured);
const opened = ref(false);
const address = "hello@lesnaya.example";
const feedback = ref("");

function open(candidate: typeof portfolioProjects[number]): void {
  project.value = candidate;
  opened.value = true;
}

async function copyAddress(): Promise<void> {
  try {
    await navigator.clipboard.writeText(address);
    feedback.value = copy.copied;
  } catch {
    feedback.value = copy.copyError;
  }
}
</script>

<template>
  <div class="portfolio-site">
    <header class="portfolio-header">
      <div class="portfolio-wrap">
        <a class="portfolio-name" href="#portfolio-top">{{ copy.name }}</a>
        <nav :aria-label="copy.navigation">
          <a href="#portfolio-work">{{ copy.work }}</a>
          <a href="#portfolio-about">{{ copy.about }}</a>
          <a href="#portfolio-contact">{{ copy.contact }}</a>
          <a v-if="!embedded" :href="applicationRecipesHref(locale)">{{ copy.back }}</a>
        </nav>
      </div>
    </header>

    <main id="portfolio-top">
      <section class="portfolio-wrap portfolio-hero" aria-labelledby="portfolio-title">
        <div class="portfolio-hero-head">
          <div>
            <p class="portfolio-genre">{{ copy.genre }}</p>
            <h1 id="portfolio-title">{{ copy.title }}</h1>
          </div>
          <div>
            <p class="portfolio-lead">{{ copy.lead }}</p>
            <WlButton variant="link" href="#portfolio-work" icon-position="end">
              {{ copy.seeWork }}
              <template #icon><WlIcon name="chevron-down" :size="16" /></template>
            </WlButton>
          </div>
        </div>
        <figure>
          <img
            :src="featured.image"
            :alt="featured[locale].alt"
            width="1320"
            height="880"
            fetchpriority="high"
          />
          <figcaption>
            <button
              class="portfolio-feature-link"
              type="button"
              aria-haspopup="dialog"
              @click="open(featured)"
            >
              {{ featured[locale].title }} <WlIcon name="arrow-up-right" :size="15" />
            </button>
            <span>{{ featured[locale].location }} · {{ featured.year }}</span>
          </figcaption>
        </figure>
      </section>

      <section id="portfolio-work" class="portfolio-wrap portfolio-section" aria-labelledby="portfolio-work-title">
        <div class="portfolio-line">
          <h2 id="portfolio-work-title">{{ copy.workTitle }}</h2>
          <WlSegmented
            v-model="filter"
            :options="filters"
            size="sm"
            :aria-label="copy.filter"
          />
        </div>
        <div class="portfolio-grid">
          <article v-for="item in projects" :key="item.id" class="portfolio-project">
            <button
              type="button"
              class="portfolio-project-link"
              aria-haspopup="dialog"
              @click="open(item)"
            >
              <img
                :src="item.image"
                alt=""
                width="660"
                height="440"
                loading="lazy"
              />
              <span class="portfolio-project-meta">{{ copy[item.type] }} · {{ item.year }}</span>
              <span class="portfolio-project-title">
                {{ item[locale].title }}
                <WlIcon name="arrow-up-right" :size="18" />
              </span>
              <span class="portfolio-project-meta">{{ item[locale].location }}</span>
            </button>
          </article>
        </div>
      </section>

      <section id="portfolio-about" class="portfolio-about portfolio-section" aria-labelledby="portfolio-about-title">
        <div class="portfolio-wrap portfolio-about-inner">
          <div>
            <h2 id="portfolio-about-title">{{ copy.aboutTitle }}</h2>
            <p class="portfolio-lead">{{ copy.aboutLead }}</p>
          </div>
          <ol class="portfolio-process">
            <li v-for="item in copy.process" :key="item.title">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="portfolio-contact" class="portfolio-wrap portfolio-section portfolio-contact" aria-labelledby="portfolio-contact-title">
        <div>
          <h2 id="portfolio-contact-title">{{ copy.contactTitle }}</h2>
          <p class="portfolio-lead">{{ copy.contactLead }}</p>
        </div>
        <div class="wl-stack" data-space="sm">
          <code>{{ address }}</code>
          <div>
            <WlButton variant="primary" @click="copyAddress">
              <template #icon><WlIcon name="copy" :size="16" /></template>
              {{ copy.copy }}
            </WlButton>
          </div>
          <p v-if="feedback" class="wl-text-small" role="status">{{ feedback }}</p>
        </div>
      </section>
    </main>

    <footer class="portfolio-footer">
      <div class="portfolio-wrap">
        <span>{{ copy.name }} · {{ copy.genre }}</span>
        <a href="#portfolio-top">{{ copy.top }} <WlIcon name="arrow-up" :size="14" /></a>
      </div>
    </footer>

    <WlDialog v-model:visible="opened" :header="project[locale].title" size="lg">
      <article class="portfolio-case">
        <img
          :src="project.image"
          :alt="project[locale].alt"
          width="990"
          height="660"
        />
        <div class="portfolio-case-detail">
          <dl>
            <div><dt>{{ copy.location }}</dt><dd>{{ project[locale].location }}</dd></div>
            <div><dt>{{ copy.genreLabel }}</dt><dd>{{ copy[project.type] }}</dd></div>
            <div><dt>{{ copy.year }}</dt><dd>{{ project.year }}</dd></div>
          </dl>
          <div>
            <p>{{ project[locale].brief }}</p>
            <p>{{ project[locale].approach }}</p>
          </div>
        </div>
      </article>
    </WlDialog>
  </div>
</template>

<style scoped src="./portfolio.css"></style>
