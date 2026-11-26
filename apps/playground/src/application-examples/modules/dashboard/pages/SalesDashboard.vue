<script setup lang="ts">
import { WlButton, WlIcon, WlPill, WlProgress, WlSegmented, WlSelect, WlStatCard, WlSwitch, WlTable, type WlTableColumn } from "legato-ui";
import { computed, inject, ref } from "vue";
import type { ApplicationExampleProps } from "../../../catalog";
import { orderTones, type SalesChannel, salesChannels, salesDate, salesFormat, salesLabels, type SalesOrder, workspaceKey } from "../sales";
import SalesTrend from "./SalesTrend.vue";

const { locale } = defineProps<ApplicationExampleProps>();
const { orders, openOrders } = inject(workspaceKey)!;
const copy = locale === "ru"
  ? {
      dates: "Период отчёта", week: "7 дней", month: "30 дней", quarter: "Квартал", all: "Все каналы",
      revenue: "Выручка", orders: "Заказы", average: "Средний чек", returns: "Возвраты",
      chart: "Динамика выручки", timeline: "Сравнить периоды", current: "Этот период", past: "Прошлый период",
      byChannel: "Продажи по каналам", share: "Доля выручки", recent: "Последние заказы", go: "Все заказы",
      export: "Скачать CSV", pending: "Заказы к отправке", growth: "К прошлому периоду"
    }
  : {
      dates: "Reporting period", week: "7 days", month: "30 days", quarter: "Quarter", all: "All channels",
      revenue: "Revenue", orders: "Orders", average: "Average order", returns: "Refunds",
      chart: "Revenue over time", timeline: "Compare periods", current: "This period", past: "Previous period",
      byChannel: "Sales by channel", share: "Share of revenue", recent: "Recent orders", go: "All orders",
      export: "Download CSV", pending: "Orders to ship", growth: "Versus previous period"
    };
const common = salesLabels[locale];
const format = salesFormat(locale);
const axis = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format;
const percent = Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format;
const sharePercent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format;
const period = ref<"week" | "month" | "quarter" | null>("month");
const channel = ref<SalesChannel | null>(null);
const compare = ref(true);
const periods = [
  { value: "week", label: copy.week }, { value: "month", label: copy.month }, { value: "quarter", label: copy.quarter }
] as const;
const channelOptions = salesChannels.map((value) => ({ value, label: common.channels[value] }));
const columns: readonly WlTableColumn<SalesOrder>[] = [
  { key: "id", label: common.order }, { key: "customer", label: common.customer }, { key: "day", label: common.date },
  { key: "status", label: common.status }, { key: "total", label: common.total, numeric: true }
];
const days = computed(() => ({ week: 7, month: 30, quarter: 90 })[period.value ?? "month"]);
const dateRange = computed(() => format.range(salesDate(days.value - 1), salesDate(0)));
const currentOrders = computed(() => orders.value.filter((order) => order.day < days.value));
const selectedOrders = computed(() => currentOrders.value.filter((order) => !channel.value || order.channel === channel.value));
const earlierOrders = computed(() => orders.value.filter((order) => order.day >= days.value
  && order.day < days.value * 2 && (!channel.value || order.channel === channel.value)));
const recent = computed(() => selectedOrders.value.slice(0, 5));
const toShip = computed(() => selectedOrders.value.filter(({ status }) => status === "processing").length);

function revenue(source: readonly SalesOrder[]): number {
  return source.reduce((total, order) => order.status === "refunded" ? total : total + order.total, 0);
}

function metrics(source: readonly SalesOrder[]): Record<"revenue" | "orders" | "average" | "returns", number> {
  const refunds = source.filter(({ status }) => status === "refunded").length;
  const total = revenue(source);
  return { revenue: total, orders: source.length, average: total / (source.length - refunds || 1), returns: refunds };
}

const cards = computed(() => {
  const current = metrics(selectedOrders.value);
  const previous = metrics(earlierOrders.value);
  const options = [
    { id: "revenue", icon: "chart-bar", format: format.money },
    { id: "orders", icon: "box", format: format.number },
    { id: "average", icon: "tag", format: format.money },
    { id: "returns", icon: "history", format: format.number }
  ] as const;
  return options.map((item) => {
    const change = previous[item.id] ? (current[item.id] - previous[item.id]) / previous[item.id] : null;
    const beneficial = change !== null && (item.id === "returns" ? change < 0 : change > 0);
    const tone = !change ? "neutral" : beneficial ? "success" : "warning";
    return { ...item, amount: item.format(current[item.id]), delta: change === null ? "—" : percent(change), tone } as const;
  });
});

const points = computed(() => {
  const width = days.value === 7 ? 1 : days.value / 10;
  const sumBetween = (source: readonly SalesOrder[], start: number, end: number) =>
    revenue(source.filter(({ day }) => day >= end && day < start));
  return Array.from({ length: days.value / width }, (_, index) => {
    const start = days.value - index * width;
    const end = start - width;
    return {
      label: format.day(salesDate(start - 1)),
      revenue: sumBetween(selectedOrders.value, start, end),
      previous: sumBetween(earlierOrders.value, start + days.value, end + days.value)
    };
  });
});

const channels = computed(() => {
  const total = revenue(currentOrders.value);
  return channelOptions.map((item) => {
    const amount = revenue(currentOrders.value.filter((order) => order.channel === item.value));
    return { ...item, amount: format.money(amount), share: total ? amount / total : 0 };
  }).sort((left, right) => right.share - left.share);
});

function saveReport(): void {
  const rows = [
    [common.order, common.date, common.channel, common.status, common.total],
    ...selectedOrders.value.map((order) => [
      order.id, salesDate(order.day).toISOString().slice(0, 10), common.channels[order.channel], common.statuses[order.status], order.total
    ])
  ];
  const csv = rows.map((row) => row.join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "north-sales-" + days.value + "d.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <section class="sales-dashboard wl-stack" data-space="lg" :aria-label="copy.dates">
    <div class="sales-toolbar">
      <div class="wl-inline" data-space="sm">
        <WlSegmented
          v-model="period"
          :options="periods"
          size="sm"
          :aria-label="copy.dates"
        />
        <div class="sales-channel-filter">
          <WlSelect
            v-model="channel"
            :options="channelOptions"
            option-label="label"
            option-value="value"
            :aria-label="common.channel"
            :placeholder="copy.all"
            size="sm"
            clearable
          />
        </div>
      </div>
      <div class="wl-inline" data-space="sm">
        <span class="sales-date"><WlIcon name="calendar" :size="15" /> {{ dateRange }}</span>
        <WlButton size="sm" @click="saveReport">
          <template #icon><WlIcon name="download" :size="15" /></template>
          {{ copy.export }}
        </WlButton>
      </div>
    </div>
    <div class="sales-stats" aria-live="polite">
      <WlStatCard
        v-for="card in cards"
        :key="card.id"
        class="sales-stat"
        :class="{ 'sales-stat--featured': card.id === 'revenue' }"
        :label="copy[card.id]"
        :value="card.amount"
        :icon="card.icon"
        :data-testid="'sales-' + card.id"
      >
        <template #delta>
          <WlPill :label="card.delta" :tone="card.tone" />
          <span class="sales-stat-caption">{{ copy.growth }}</span>
        </template>
      </WlStatCard>
    </div>
    <div class="app-example-split">
      <section class="app-example-panel wl-stack" data-space="sm" aria-labelledby="sales-trend">
        <div class="app-example-actions">
          <h2 id="sales-trend" class="wl-text-subheading">{{ copy.chart }}</h2>
          <WlSwitch v-model="compare">{{ copy.timeline }}</WlSwitch>
        </div>
        <div class="sales-legend wl-inline" data-space="sm">
          <span>{{ copy.current }}</span><span v-if="compare">{{ copy.past }}</span>
        </div>
        <SalesTrend
          :points="points"
          :compare="compare"
          :current-label="copy.current"
          :previous-label="copy.past"
          :format-money="format.money"
          :format-axis="axis"
        />
      </section>
      <section class="app-example-panel sales-channel-panel wl-stack" data-space="md" aria-labelledby="sales-channels">
        <div>
          <h2 id="sales-channels" class="wl-text-subheading">{{ copy.byChannel }}</h2>
          <p class="wl-text-small wl-text-muted">{{ copy.share }}</p>
        </div>
        <button
          v-for="item in channels"
          :key="item.value"
          class="sales-channel"
          type="button"
          :aria-pressed="channel === item.value"
          @click="channel = channel === item.value ? null : item.value"
        >
          <span><strong>{{ item.label }}</strong><span>{{ sharePercent(item.share) }}</span></span>
          <WlProgress
            :value="item.share * 100"
            :aria-label="item.label"
            :tone="item.value === 'online' ? 'accent' : 'info'"
            thin
          />
          <span class="wl-text-small wl-text-muted">{{ item.amount }}</span>
        </button>
        <div class="sales-fulfillment">
          <span class="wl-inline" data-space="xs"><WlIcon name="box" :size="15" /> {{ copy.pending }}</span>
          <WlPill :label="format.number(toShip)" :tone="toShip ? 'warning' : 'neutral'" />
        </div>
      </section>
    </div>
    <section class="app-example-panel wl-stack" data-space="sm" aria-labelledby="recent-orders">
      <div class="app-example-actions">
        <h2 id="recent-orders" class="wl-text-subheading">{{ copy.recent }}</h2>
        <WlButton
          size="sm"
          variant="ghost"
          icon-position="end"
          @click="openOrders()"
        >
          {{ copy.go }}
          <template #icon><WlIcon name="arrow-right" :size="15" /></template>
        </WlButton>
      </div>
      <div
        class="wl-scroll-area"
        role="region"
        :aria-label="copy.recent"
        tabindex="0"
      >
        <WlTable :value="recent" :columns="columns" row-key="id">
          <template #cell-id="{ row }"><WlButton variant="link" size="sm" @click="openOrders(row.id)">{{ row.id }}</WlButton></template>
          <template #cell-day="{ row }">{{ format.day(salesDate(row.day)) }}</template>
          <template #cell-status="{ row }"><WlPill :label="common.statuses[row.status]" :tone="orderTones[row.status]" dot /></template>
          <template #cell-total="{ row }">{{ format.money(row.total) }}</template>
        </WlTable>
      </div>
    </section>
  </section>
</template>

<style scoped>
.sales-toolbar { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.sales-channel-filter { width: 178px; max-width: 100%; }
.sales-date { display: inline-flex; align-items: center; gap: 6px; color: var(--wl-text-muted); font-size: var(--wl-type-small-size); }
.sales-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--wl-space-sm); }
.sales-stat { min-width: 0; }
.sales-stat--featured {
  background: color-mix(in srgb, var(--wl-bg-raised) 62%, var(--wl-accent-soft));
  border-color: var(--wl-accent-border);
}
.sales-stat :deep(.wl-card__content) { gap: 7px; padding: clamp(10px, 1.6vw, 18px); }
.sales-stat :deep(.wl-stat-card__value) { font-size: clamp(16px, 1.95vw, 27px); white-space: nowrap; }
.sales-stat :deep(.wl-stat-card__delta) { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; }
.sales-stat-caption { font-size: 11px; }
.sales-legend { color: var(--wl-text-muted); font-size: var(--wl-type-small-size); }
.sales-legend span { display: inline-flex; gap: 6px; align-items: center; }
.sales-legend span::before { content: ""; width: 15px; border-top: 2px solid var(--wl-accent); }
.sales-legend span + span::before { border-color: var(--wl-info-text); border-top-style: dashed; }
.sales-channel-panel h2 { margin-bottom: 4px; }
.sales-channel {
  display: grid;
  gap: 5px;
  min-width: 0;
  margin-inline: -5px;
  padding: 5px;
  border: 1px solid transparent;
  border-radius: var(--wl-radius);
  text-align: start;
  color: var(--wl-text);
  background: transparent;
  cursor: pointer;
}
.sales-channel:is(:hover, [aria-pressed="true"]) { border-color: var(--wl-accent-border); background: var(--wl-accent-soft); }
.sales-channel > span:first-child, .sales-fulfillment { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.sales-fulfillment { padding-top: 10px; margin-top: auto; border-top: 1px solid var(--wl-border); font-size: var(--wl-type-small-size); }
@media (max-width: 1000px) and (min-width: 741px), (max-width: 620px) {
  .sales-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 420px) {
  .sales-stat-caption { display: none; }
}
</style>
