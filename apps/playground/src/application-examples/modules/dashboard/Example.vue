<script setup lang="ts">
import "./dashboard.css";
import { WlAvatar, WlButton, WlCommandPalette, type WlCommandPaletteGroup, type WlCommandPaletteItem, WlIcon, WlNavItem } from "legato-ui";
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, provide, ref, shallowRef } from "vue";
import { applicationLocationEvent, type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";
import { createSalesOrders, salesFormat, workspaceKey } from "./sales";
import { dashboardView, type DashboardViewId, dashboardViews } from "./views";

const props = defineProps<ApplicationModuleProps>();
const pages = {
  dashboard: defineAsyncComponent(() => import("./pages/SalesDashboard.vue")),
  board: defineAsyncComponent(() => import("./pages/TaskBoard.vue")),
  calendar: defineAsyncComponent(() => import("./pages/TeamCalendar.vue")),
  orders: defineAsyncComponent(() => import("./pages/OrdersDesk.vue")),
  settings: defineAsyncComponent(() => import("./pages/ProjectSettings.vue"))
};
const recipes = applicationRecipesHref(props.locale);
const ru = props.locale === "ru";
const copy = ru
  ? { brand: "Север", store: "Магазин и команда", sales: "Продажи", team: "Команда", search: "Быстрый поиск",
      placeholder: "Раздел или номер заказа", pages: "Разделы", orders: "Заказы", back: "К примерам", name: "Мария Ким", role: "Управляющая" }
  : { brand: "North", store: "Store & team", sales: "Sales", team: "Team", search: "Quick search",
      placeholder: "Page or order number", pages: "Pages", orders: "Orders", back: "Back to examples", name: "Maria Kim", role: "Store manager" };
const groups = [
  { label: copy.sales, items: dashboardViews.slice(0, 2) },
  { label: copy.team, items: dashboardViews.slice(2) }
];
const initialQuery = new URLSearchParams(location.search);
const example = shallowRef(dashboardView(initialQuery.get("view") ?? initialQuery.get("app")) ?? dashboardViews[0]);
const orderId = ref(example.value.id === "orders" ? initialQuery.get("order") : null);
const orders = ref(createSalesOrders(props.locale));
const format = salesFormat(props.locale);
const searchOpen = ref(false);
const heading = ref<HTMLHeadingElement>();
const searchGroups = computed<WlCommandPaletteGroup[]>(() => [
  { id: "pages", label: copy.pages, items: dashboardViews.map((page) => ({
    id: page.id, label: page[props.locale], icon: page.icon
  })) },
  { id: "orders", label: copy.orders, showWhenEmpty: false, items: orders.value.map((order) => ({
    id: order.id, label: order.id + " · " + order.customer, description: format.money(order.total), icon: "box" as const
  })) }
]);

function routeTo(id: DashboardViewId, order?: string): URL {
  const url = new URL(location.href);
  url.searchParams.set("app", "dashboard");
  if (id === "dashboard") url.searchParams.delete("view");
  else url.searchParams.set("view", id);
  url.searchParams.delete("order");
  if (id === "orders" && order) url.searchParams.set("order", order);
  return url;
}

function readRoute(): void {
  const query = new URLSearchParams(location.search);
  const page = dashboardView(query.get("view") ?? query.get("app")) ?? dashboardViews[0];
  const changed = page !== example.value;
  example.value = page;
  orderId.value = page.id === "orders" ? query.get("order") : null;
  document.title = page[props.locale] + " · Legato UI";
  if (changed) {
    window.scrollTo(0, 0);
    void nextTick(() => heading.value?.focus({ preventScroll: true }));
  }
  if (props.embedded) {
    window.parent.postMessage({
      type: applicationLocationEvent, app: "dashboard", view: page.id === "dashboard" ? undefined : page.id, order: orderId.value
    }, location.origin);
  }
}

function goTo(id: DashboardViewId, order?: string): void {
  const url = routeTo(id, order);
  if (url.href === location.href) return;
  if (props.embedded) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
  readRoute();
}

function follow(event: MouseEvent, id: DashboardViewId): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  goTo(id);
}

function selectSearch(item: WlCommandPaletteItem): void {
  const page = dashboardView(item.id);
  if (page) goTo(page.id);
  else goTo("orders", item.id);
}

provide(workspaceKey, { orders, orderId, openOrders: (id) => goTo("orders", id) });
onMounted(() => {
  readRoute();
  window.addEventListener("popstate", readRoute);
});
onUnmounted(() => window.removeEventListener("popstate", readRoute));
</script>

<template>
  <div class="app-example-root" :data-application="example.id">
    <aside class="app-example-rail">
      <a class="app-example-brand" :href="routeTo('dashboard').href" @click="follow($event, 'dashboard')">
        <span class="app-example-brand-icon"><WlIcon name="waves" :size="22" /></span>
        <span><strong>{{ copy.brand }}</strong><small>{{ copy.store }}</small></span>
      </a>
      <nav class="app-example-nav" :aria-label="copy.pages">
        <div v-for="group in groups" :key="group.label" class="app-example-nav-group">
          <p class="wl-text-small wl-text-muted">{{ group.label }}</p>
          <WlNavItem
            v-for="page in group.items"
            :key="page.id"
            :href="routeTo(page.id).href"
            :icon="page.icon"
            :label="page[locale]"
            :active="example.id === page.id"
            size="sm"
            @click="follow($event, page.id)"
          />
        </div>
      </nav>
      <div class="app-example-account">
        <WlAvatar :label="ru ? 'МК' : 'MK'" :size="32" />
        <span><strong>{{ copy.name }}</strong><small>{{ copy.role }}</small></span>
      </div>
    </aside>
    <header class="app-example-bar">
      <WlButton
        class="app-example-search"
        size="sm"
        :aria-label="copy.search"
        @click="searchOpen = true"
      >
        <template #icon><WlIcon name="search" :size="16" /></template>
        {{ copy.search }}<kbd>Ctrl K</kbd>
      </WlButton>
      <a v-if="!embedded" :href="recipes" class="app-example-back">{{ copy.back }}</a>
    </header>
    <main class="app-example-main wl-stack" data-space="lg">
      <h1 ref="heading" class="wl-text-title" tabindex="-1">{{ example[locale] }}</h1>
      <component :is="pages[example.id]" :locale="locale" />
    </main>
    <WlCommandPalette
      v-model:visible="searchOpen"
      :groups="searchGroups"
      :placeholder="copy.placeholder"
      shortcut
      @select="selectSearch"
    />
  </div>
</template>
