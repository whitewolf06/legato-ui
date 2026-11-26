<script setup lang="ts">
import { WlButton, WlDialog, WlField, WlIcon, WlPill, WlSegmented, WlSelect, type WlTabItem, WlTabs } from "legato-ui";
import { computed, ref } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";

const { locale } = defineProps<ApplicationModuleProps>();
const text = locale === "ru"
  ? {
      brand: "Полка", title: "Планы и подписка", lead: "Управляйте тарифом и местами команды «Вега».",
      back: "К примерам", plans: "Тарифы", invoices: "Счета", plan: "Тариф", seats: "Места в команде",
      monthly: "Месяц", yearly: "Год", perMonth: "/ месяц", perYear: "/ год", current: "Текущий тариф",
      choose: "Выбрать", apply: "Применить", confirmTitle: "Изменить подписку", total: "К оплате",
      updated: "Подписка обновлена в демонстрации.", number: "Номер", amount: "Сумма", download: "Скачать",
      names: ["Старт", "Команда", "Студия"],
      features: [
        ["Общие папки", "История за 7 дней", "10 ГБ для команды"],
        ["Гостевой доступ", "История за 90 дней", "100 ГБ для команды"],
        ["Роли и аудит доступа", "История за год", "500 ГБ для команды"]
      ]
    }
  : {
      brand: "Shelf", title: "Plans and subscription", lead: "Manage the plan and seats for the Vega team.",
      back: "Back to examples", plans: "Plans", invoices: "Invoices", plan: "Plan", seats: "Team seats",
      monthly: "Monthly", yearly: "Annual", perMonth: "/ month", perYear: "/ year", current: "Current plan",
      choose: "Choose", apply: "Apply", confirmTitle: "Change subscription", total: "Total",
      updated: "Subscription updated in this demo.", number: "Number", amount: "Amount", download: "Download",
      names: ["Starter", "Team", "Studio"],
      features: [
        ["Shared folders", "7-day history", "10 GB for the team"],
        ["Guest access", "90-day history", "100 GB for the team"],
        ["Roles and access audit", "One year of history", "500 GB for the team"]
      ]
    };
const plans = text.names.map((name, index) => ({ id: index, name, rate: [390, 690, 1090][index]!, items: text.features[index]! }));
const tabs: WlTabItem[] = [{ key: "plans", label: text.plans, icon: "sliders-h" }, { key: "invoices", label: text.invoices, icon: "file" }];
const tab = ref("plans");
const term = ref<"month" | "year" | null>("month");
const seats = ref<number | null>(5);
const choices = [{ value: "month", label: text.monthly }, { value: "year", label: text.yearly }] as const;
const seatOptions = [3, 5, 8, 12, 20].map((value) => ({ value, label: String(value) }));
const current = ref({ id: 1, seats: 5, annual: false });
const selected = ref<typeof plans[number]>();
const open = ref(false);
const feedback = ref("");
const invoices = ref([{ id: "PL-204", plan: text.names[1]!, amount: 3450 }, { id: "PL-191", plan: text.names[1]!, amount: 3450 }]);
const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format;
const selectedSeats = computed(() => seats.value ?? 5);
const annual = computed(() => term.value === "year");

function price(plan: typeof plans[number], count: number, yearly: boolean): number {
  return plan.rate * count * (yearly ? 10 : 1);
}
function choose(plan: typeof plans[number]): void {
  selected.value = plan;
  open.value = true;
}
function apply(): void {
  const plan = selected.value;
  if (!plan) return;
  current.value = { id: plan.id, seats: selectedSeats.value, annual: annual.value };
  invoices.value.unshift({ id: "PL-" + (205 + invoices.value.length - 2), plan: plan.name, amount: price(plan, current.value.seats, current.value.annual) });
  feedback.value = text.updated;
  open.value = false;
}
function download(invoice: typeof invoices.value[number]): void {
  const receipt = [text.brand + " · " + invoice.id, invoice.plan, currency(invoice.amount)].join("\n");
  const href = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
  const file = Object.assign(document.createElement("a"), { href, download: invoice.id + ".txt" });
  file.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
</script>

<template>
  <div class="subscription-demo">
    <header class="demo-header">
      <div>
        <span class="demo-brand"><WlIcon name="grid" :size="22" />{{ text.brand }}</span>
        <a v-if="!embedded" class="demo-return" :href="applicationRecipesHref(locale)">{{ text.back }}</a>
      </div>
    </header>
    <main class="demo-content wl-stack" data-space="xl">
      <div class="demo-line">
        <div class="wl-stack" data-space="xs">
          <h1 class="wl-text-title">{{ text.title }}</h1><p class="wl-text-muted">{{ text.lead }}</p>
        </div>
        <WlPill :label="plans[current.id]!.name + ' · ' + current.seats" tone="accent" />
      </div>
      <p v-if="feedback" class="wl-text-small" role="status">{{ feedback }}</p>
      <WlTabs v-model="tab" :items="tabs">
        <template #panel="{ item }">
          <section
            v-if="item.key === 'plans'"
            class="wl-stack"
            data-space="lg"
            :aria-label="text.plans"
          >
            <div class="demo-line">
              <WlSegmented v-model="term" :options="choices" :aria-label="text.plan" />
              <div class="subscription-seats">
                <WlField :label="text.seats">
                  <template #default="{ id }">
                    <WlSelect
                      :id="id"
                      v-model="seats"
                      :options="seatOptions"
                      option-label="label"
                      option-value="value"
                      :aria-label="text.seats"
                    />
                  </template>
                </WlField>
              </div>
            </div>
            <div class="subscription-plans">
              <article
                v-for="plan in plans"
                :key="plan.id"
                class="demo-panel subscription-plan wl-stack"
                :class="{ 'subscription-plan--current': plan.id === current.id }"
                data-space="md"
              >
                <div class="demo-line">
                  <h2 class="wl-text-subheading">{{ plan.name }}</h2>
                  <WlPill v-if="plan.id === current.id" :label="text.current" tone="accent" />
                </div>
                <p class="subscription-price">
                  <strong>{{ currency(price(plan, selectedSeats, annual)) }}</strong> {{ annual ? text.perYear : text.perMonth }}
                </p>
                <ul class="wl-stack" data-space="sm">
                  <li v-for="feature in plan.items" :key="feature">
                    <WlIcon name="check" :size="16" /> {{ feature }}
                  </li>
                </ul>
                <WlButton
                  :variant="plan.id === current.id ? 'secondary' : 'primary'"
                  :aria-label="text.choose + ' · ' + plan.name"
                  :disabled="current.id === plan.id && current.seats === selectedSeats && current.annual === annual"
                  @click="choose(plan)"
                >{{ text.choose }}</WlButton>
              </article>
            </div>
          </section>
          <section
            v-else
            class="demo-panel wl-stack"
            data-space="md"
            :aria-label="text.invoices"
          >
            <h2 class="wl-text-subheading">{{ text.invoices }}</h2>
            <ul class="subscription-invoices">
              <li v-for="invoice in invoices" :key="invoice.id" class="demo-line">
                <div><strong>{{ invoice.id }}</strong><p class="wl-text-small wl-text-muted">{{ invoice.plan }}</p></div>
                <span>{{ currency(invoice.amount) }}</span>
                <WlButton
                  size="sm"
                  variant="link"
                  :aria-label="text.download + ' ' + invoice.id"
                  @click="download(invoice)"
                >{{ text.download }}</WlButton>
              </li>
            </ul>
          </section>
        </template>
      </WlTabs>
    </main>
    <WlDialog v-model:visible="open" :header="text.confirmTitle" size="sm">
      <div v-if="selected" class="wl-stack" data-space="md">
        <p>{{ selected.name }} · {{ selectedSeats }} · {{ annual ? text.yearly : text.monthly }}</p>
        <p>{{ text.total }} <strong>{{ currency(price(selected, selectedSeats, annual)) }}</strong></p>
        <div><WlButton variant="primary" @click="apply">{{ text.apply }}</WlButton></div>
      </div>
    </WlDialog>
  </div>
</template>

<style scoped>
.subscription-demo { min-height: 100dvh; background: color-mix(in srgb, var(--wl-bg) 80%, var(--wl-bg-soft)); }
.subscription-seats { width: 130px; max-width: 100%; }
.subscription-plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--wl-space-md); }
.subscription-plan { align-items: stretch; }
.subscription-plan--current { border-color: var(--wl-accent-border-hover); background: var(--wl-accent-soft); }
.subscription-price { color: var(--wl-text-muted); font-size: var(--wl-type-small-size); }
.subscription-price strong { color: var(--wl-text); font-size: clamp(1.1rem, 2.45vw, 1.9rem); }
.subscription-plan ul, .subscription-invoices { list-style: none; margin: 0; padding: 0; }
.subscription-plan li { display: flex; align-items: center; gap: 7px; }
.subscription-plan li :first-child { color: var(--wl-text-accent); flex: none; }
.subscription-plan .wl-btn { margin-top: auto; }
.subscription-invoices li { padding: 11px 0; border-top: 1px solid var(--wl-border); }
@media (max-width: 700px) { .subscription-plans { grid-template-columns: minmax(0, 1fr); } }
</style>
