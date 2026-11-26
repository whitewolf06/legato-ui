<script setup lang="ts">
import { WlButton, WlDialog, WlField, WlIcon, WlInput, WlSegmented, WlSelect, WlTextarea } from "legato-ui";
import { computed, ref } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";

const { locale } = defineProps<ApplicationModuleProps>();
const text = locale === "ru"
  ? {
      brand: "Переплёт", title: "Редактор рассылки", back: "К примерам", settings: "Письмо", preview: "Предпросмотр",
      subject: "Тема письма", headline: "Заголовок", body: "Текст", audience: "Аудитория", all: "Все читатели", new: "Новые подписчики",
      wide: "Широкий", phone: "Телефон", save: "Сохранить черновик", schedule: "Назначить отправку",
      date: "Дата отправки", apply: "Подтвердить", saved: "Черновик сохранён в этом окне.",
      scheduled: "Дата отправки в демонстрации", draft: "Книжные находки ноября", greeting: "Доброго вечера",
      starter: "Собрали три истории для тихих осенних вечеров. Начните с той, что ближе по настроению."
    }
  : {
      brand: "Bookbinding", title: "Newsletter editor", back: "Back to examples", settings: "Message", preview: "Preview",
      subject: "Subject line", headline: "Headline", body: "Body", audience: "Audience", all: "All readers", new: "New subscribers",
      wide: "Wide", phone: "Phone", save: "Save draft", schedule: "Schedule send",
      date: "Send date", apply: "Confirm", saved: "Draft saved in this window.",
      scheduled: "Scheduled demo date", draft: "November reading picks", greeting: "Good evening",
      starter: "Three stories for quiet autumn evenings. Start with the one that fits your mood."
    };
const key = "legato-ui.newsletter." + locale;
function restore(): Record<string, unknown> {
  try {
    const draft: unknown = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return draft && typeof draft === "object" ? draft as Record<string, unknown> : {};
  } catch { return {}; }
}
const draft = restore();
const subject = ref(typeof draft.subject === "string" ? draft.subject : text.draft);
const headline = ref(typeof draft.headline === "string" ? draft.headline : text.greeting);
const body = ref(typeof draft.body === "string" ? draft.body : text.starter);
const audience = ref<"all" | "new" | null>(draft.audience === "new" ? "new" : "all");
const audiences = [{ value: "all", label: text.all }, { value: "new", label: text.new }] as const;
const widths = [{ value: "wide", label: text.wide }, { value: "phone", label: text.phone }] as const;
const width = ref<"wide" | "phone" | null>("wide");
const open = ref(false);
const date = ref("");
const feedback = ref("");
const complete = computed(() => Boolean(subject.value.trim() && headline.value.trim() && body.value.trim()));
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dateFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format;

function save(): void {
  const data = { subject: subject.value, headline: headline.value, body: body.value, audience: audience.value };
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    feedback.value = text.saved;
  } catch {
    feedback.value = locale === "ru" ? "Сохранение черновика недоступно в этом окне." : "Draft storage is unavailable.";
  }
}
function schedule(): void {
  if (!complete.value || !date.value || date.value < tomorrow) return;
  feedback.value = text.scheduled + " · " + dateFormat(new Date(date.value + "T00:00:00Z"));
  open.value = false;
}
</script>

<template>
  <div class="newsletter-demo">
    <header class="demo-header">
      <div>
        <span class="demo-brand"><WlIcon name="book" :size="21" />{{ text.brand }}</span>
        <a v-if="!embedded" class="demo-return" :href="applicationRecipesHref(locale)">{{ text.back }}</a>
      </div>
    </header>
    <main class="demo-content wl-stack" data-space="lg">
      <div class="demo-line">
        <h1 class="wl-text-title">{{ text.title }}</h1>
        <div class="wl-inline" data-space="sm">
          <WlButton size="sm" @click="save">{{ text.save }}</WlButton>
          <WlButton
            size="sm"
            variant="primary"
            :disabled="!complete"
            @click="open = true"
          >{{ text.schedule }}</WlButton>
        </div>
      </div>
      <p v-if="feedback" class="wl-text-small" role="status">{{ feedback }}</p>
      <div class="newsletter-grid">
        <section class="demo-panel newsletter-fields wl-stack" data-space="md" :aria-label="text.settings">
          <h2 class="wl-text-subheading">{{ text.settings }}</h2>
          <WlField :label="text.subject">
            <template #default="{ id }"><WlInput :id="id" v-model="subject" maxlength="100" /></template>
          </WlField>
          <WlField :label="text.headline">
            <template #default="{ id }"><WlInput :id="id" v-model="headline" maxlength="100" /></template>
          </WlField>
          <WlField :label="text.body">
            <template #default="{ id }"><WlTextarea
              :id="id"
              v-model="body"
              :rows="4"
              maxlength="600"
            /></template>
          </WlField>
          <WlField :label="text.audience">
            <template #default="{ id }">
              <WlSelect
                :id="id"
                v-model="audience"
                :options="audiences"
                option-label="label"
                option-value="value"
                :aria-label="text.audience"
              />
            </template>
          </WlField>
        </section>
        <section class="demo-panel newsletter-preview wl-stack" data-space="md" :aria-label="text.preview">
          <div class="demo-line">
            <h2 class="wl-text-subheading">{{ text.preview }}</h2>
            <WlSegmented
              v-model="width"
              size="sm"
              :options="widths"
              :aria-label="text.preview"
            />
          </div>
          <div class="newsletter-mail" :class="{ 'newsletter-mail--phone': width === 'phone' }">
            <p class="newsletter-subject">{{ subject }}</p>
            <article class="newsletter-page">
              <p>{{ text.brand }}</p>
              <h3>{{ headline }}</h3>
              <p>{{ body }}</p>
            </article>
          </div>
        </section>
      </div>
    </main>
    <WlDialog v-model:visible="open" :header="text.schedule" size="sm">
      <form class="demo-dialog-form wl-stack" data-space="md" @submit.prevent="schedule">
        <WlField :label="text.date" required>
          <template #default="{ id }">
            <input
              :id="id"
              v-model="date"
              class="wl-input"
              type="date"
              :min="tomorrow"
              required
            />
          </template>
        </WlField>
        <div><WlButton variant="primary" type="submit">{{ text.apply }}</WlButton></div>
      </form>
    </WlDialog>
  </div>
</template>

<style scoped>
.newsletter-demo { min-height: 100dvh; background: var(--wl-bg-soft); }
.newsletter-grid { display: grid; grid-template-columns: minmax(250px, .88fr) minmax(0, 1.25fr); gap: var(--wl-space-md); }
.newsletter-fields :deep(:is(.wl-input, .wl-textarea, .wl-select)) { max-width: none; }
.newsletter-preview { background: color-mix(in srgb, var(--wl-bg-raised) 60%, var(--wl-bg-soft)); }
.newsletter-mail {
  width: 100%;
  margin-inline: auto;
  min-width: 0;
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-control);
  overflow: hidden;
  background: var(--wl-bg);
}
.newsletter-mail--phone { max-width: 305px; }
.newsletter-subject {
  padding: 10px 16px;
  border-bottom: 1px solid var(--wl-border);
  color: var(--wl-text-2);
  font-size: .85rem;
  overflow-wrap: anywhere;
}
.newsletter-page { padding: clamp(17px, 5vw, 54px); background: var(--wl-bg); overflow-wrap: anywhere; }
.newsletter-page > p:first-child {
  padding-bottom: 13px;
  border-bottom: 2px solid var(--wl-accent);
  color: var(--wl-text-accent);
  font-family: Georgia, serif;
  font-weight: 700;
  font-size: 1.28rem;
}
.newsletter-page h3 {
  margin-block: 16px 12px;
  font-family: Georgia, serif;
  font-size: clamp(1.2rem, 4vw, 2.6rem);
  line-height: 1.2;
  font-weight: 500;
}
.newsletter-page h3 + p { white-space: pre-wrap; line-height: 1.65; }
@media (max-width: 690px) { .newsletter-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
