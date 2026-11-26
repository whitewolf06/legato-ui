<script setup lang="ts">
import { WlButton, WlDrawer, WlInput, WlPagination, WlPill, WlSelect, WlTable, type WlTableColumn, type WlTableSort } from "legato-ui";
import { computed, inject, ref, watch } from "vue";
import type { ApplicationExampleProps } from "../../../catalog";
import { type OrderStatus, orderTones, salesDate, salesFormat, salesLabels, type SalesOrder, workspaceKey } from "../sales";

const { locale } = defineProps<ApplicationExampleProps>();
const { orders, orderId } = inject(workspaceKey)!;
const common = salesLabels[locale];
const format = salesFormat(locale);
const copy = locale === "ru"
  ? {
      search: "Номер заказа или имя покупателя", all: "Все статусы", reset: "Сбросить", product: "Товар",
      empty: "Заказов с такими условиями нет", ship: "Отметить отправку", count: "Найдено заказов", table: "Список заказов"
    }
  : {
      search: "Order number or customer name", all: "All statuses", reset: "Reset", product: "Product",
      empty: "No orders match these filters", ship: "Mark as shipped", count: "Orders found", table: "Orders list"
    };
const statusOptions = Object.entries(common.statuses).map(([value, label]) => ({ value: value as OrderStatus, label }));
const columns: readonly WlTableColumn<SalesOrder>[] = [
  { key: "id", label: common.order, sortable: true },
  { key: "customer", label: common.customer },
  { key: "day", label: common.date },
  { key: "channel", label: common.channel },
  { key: "status", label: common.status },
  { key: "total", label: common.total, sortable: true, numeric: true }
];
const search = ref("");
const status = ref<OrderStatus | null>(null);
const sort = ref<WlTableSort | null>(null);
const page = ref(1);
const displayedLimit = 10;
const open = ref(false);
const activeId = ref("");
const active = computed(() => orders.value.find(({ id }) => id === activeId.value));
const filtered = computed(() => {
  const key = search.value.trim().toLocaleLowerCase(locale);
  const matches = orders.value.filter((order) => (!status.value || order.status === status.value)
    && (order.id + " " + order.customer).toLocaleLowerCase(locale).includes(key));
  if (!sort.value) return matches;
  const direction = sort.value.direction === "asc" ? 1 : -1;
  const byTotal = sort.value.key === "total";
  return matches.sort((a, b) => direction * (byTotal ? a.total - b.total : a.id.localeCompare(b.id)));
});
const visibleRows = computed(() => filtered.value.slice((page.value - 1) * displayedLimit, page.value * displayedLimit));
function view(id: string): void {
  activeId.value = id;
  open.value = active.value !== undefined;
}
watch([search, status, sort], () => {
  page.value = 1;
});
watch(orderId, (id) => {
  if (id) view(id);
}, { immediate: true });
watch(filtered, (rows) => {
  page.value = Math.min(page.value, Math.max(1, Math.ceil(rows.length / displayedLimit)));
});
</script>

<template>
  <div class="app-example-panel wl-stack" data-space="md">
    <div class="wl-inline" data-space="sm">
      <div class="app-example-inline-field"><WlInput
        v-model="search"
        :aria-label="copy.search"
        :placeholder="copy.search"
        clearable
      /></div>
      <WlSelect
        v-model="status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        :aria-label="common.status"
        :placeholder="copy.all"
        clearable
      />
      <WlButton v-if="search || status" variant="ghost" @click="search = ''; status = null">{{ copy.reset }}</WlButton>
    </div>
    <div
      class="orders-table wl-scroll-area"
      role="region"
      :aria-label="copy.table"
      tabindex="0"
    >
      <WlTable
        v-model:sort="sort"
        :value="visibleRows"
        :columns="columns"
        row-key="id"
        :empty-message="copy.empty"
      >
        <template #cell-id="{ row }">
          <WlButton
            class="order-link"
            size="sm"
            variant="link"
            @click="view(row.id)"
          >{{ row.id }}</WlButton>
        </template>
        <template #cell-customer="{ row }"><span class="order-customer" :title="row.customer">{{ row.customer }}</span></template>
        <template #cell-day="{ row }">{{ format.day(salesDate(row.day)) }}</template>
        <template #cell-channel="{ row }">{{ common.channels[row.channel] }}</template>
        <template #cell-status="{ row }"><WlPill :label="common.statuses[row.status]" :tone="orderTones[row.status]" dot /></template>
        <template #cell-total="{ row }">{{ format.money(row.total) }}</template>
      </WlTable>
    </div>
    <WlPagination
      v-if="filtered.length > displayedLimit"
      v-model:page="page"
      :page-size="displayedLimit"
      :total="filtered.length"
      compact
    />
    <p v-else class="wl-text-small wl-text-muted" role="status">{{ copy.count }} {{ filtered.length }}</p>
    <WlDrawer v-model:visible="open" :header="common.order + ' ' + activeId" position="right">
      <section v-if="active" class="wl-stack" data-space="md">
        <div><WlPill :label="common.statuses[active.status]" :tone="orderTones[active.status]" dot /></div>
        <dl class="order-details">
          <dt>{{ common.customer }}</dt><dd>{{ active.customer }}</dd>
          <dt>{{ copy.product }}</dt><dd>{{ active.product }}</dd>
          <dt>{{ common.channel }}</dt><dd>{{ common.channels[active.channel] }}</dd>
          <dt>{{ common.date }}</dt><dd>{{ format.day(salesDate(active.day)) }}</dd>
          <dt>{{ common.total }}</dt><dd>{{ format.money(active.total) }}</dd>
        </dl>
        <div v-if="active.status === 'processing'">
          <WlButton variant="primary" @click="active.status = 'shipped'">{{ copy.ship }}</WlButton>
        </div>
      </section>
    </WlDrawer>
  </div>
</template>

<style scoped>
.order-details { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.45fr); gap: var(--wl-space-md); margin: 0; }
.order-details dt { color: var(--wl-text-2); }
.order-details dd { margin: 0; font-weight: 600; }
.orders-table { container-type: inline-size; }
.order-customer { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-link { white-space: nowrap; }
@container (max-width: 580px) {
  .orders-table :deep(.wl-table) { table-layout: fixed; --wl-table-cell-pad-x: var(--wl-space-xs); }
  .orders-table :deep(:is(th, td):is(:nth-child(3), :nth-child(4))) { display: none; }
  .orders-table :deep(th:nth-child(1)) { width: 6rem; }
  .orders-table :deep(th:nth-child(5)) { width: 7rem; }
  .orders-table :deep(th:last-child) { width: 5.3rem; }
  .orders-table :deep(td:last-child) { white-space: nowrap; }
  .order-link { padding-inline: 0; }
}
@container (max-width: 365px) {
  .orders-table :deep(:is(th, td):nth-child(2)) { display: none; }
  .orders-table :deep(th:nth-child(1)) { width: auto; }
}
</style>
