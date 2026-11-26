<script setup lang="ts">
import { WlButton, WlDialog, WlField, WlIcon, WlInput, WlPill, WlProgress, WlSegmented, WlSelect, type WlTabItem, WlTabs } from "legato-ui";
import { computed, nextTick, ref } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";
import { createMonitors, type Monitor, monitoringCopy, type MonitorStatus } from "./content";

const { locale } = defineProps<ApplicationModuleProps>();
const copy = monitoringCopy[locale];
const monitors = ref(createMonitors(locale));
const maximumMonitors = 12;
const selectedId = ref("store");
const selected = computed(() => monitors.value.find(({ id }) => id === selectedId.value));
const detail = ref<HTMLElement>();
const tab = ref("monitors");
const filter = ref<"all" | "attention" | null>("all");
const tabs: WlTabItem[] = [
  { key: "monitors", label: copy.monitors, icon: "activity" },
  { key: "incidents", label: copy.incidents, icon: "flag" },
  { key: "plan", label: copy.plan, icon: "briefcase" }
];
const filters = [{ value: "all", label: copy.all }, { value: "attention", label: copy.attention }] as const;
const tones = { up: "success", down: "danger", paused: "neutral", pending: "info" } as const;

function status(monitor: Monitor): MonitorStatus {
  if (monitor.paused) return "paused";
  if (!monitor.samples.length) return "pending";
  return monitor.samples.at(-1) === null ? "down" : "up";
}

const up = computed(() => monitors.value.filter((monitor) => status(monitor) === "up").length);
const down = computed(() => monitors.value.filter((monitor) => status(monitor) === "down").length);
const visible = computed(() => monitors.value.filter((monitor) => filter.value !== "attention" || status(monitor) === "down"));
const checks = computed(() => selected.value?.samples ?? []);
const succeeded = computed(() => checks.value.filter((sample) => sample !== null).length);
const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat(locale);
const acknowledged = ref(false);
const cadenceOptions = [1, 5, 15].map((value) => ({ value, label: copy.every(value) }));
const name = ref("");
const url = ref("");
const cadence = ref<number | null>(5);
const dialog = ref(false);
const error = ref("");
const feedback = ref("");

function selectMonitor(id: string): void {
  selectedId.value = id;
  if (window.matchMedia("(max-width: 690px)").matches) {
    void nextTick(() => detail.value?.focus());
  }
}

function startMonitor(): void {
  name.value = "";
  url.value = "";
  cadence.value = 5;
  error.value = "";
  dialog.value = true;
}

function saveMonitor(): void {
  let address: URL;
  try {
    address = new URL(url.value.trim());
  } catch {
    error.value = copy.invalidUrl;
    return;
  }
  if (!["http:", "https:"].includes(address.protocol)) {
    error.value = copy.invalidUrl;
    return;
  }
  if (monitors.value.some((monitor) => monitor.url === address.href)) {
    error.value = copy.duplicate;
    return;
  }
  const label = name.value.trim();
  if (!label || monitors.value.length >= maximumMonitors) return;
  const id = "monitor-" + monitors.value.length;
  monitors.value.push({ id, label, url: address.href, cadence: cadence.value ?? 5, samples: [], paused: false });
  selectedId.value = id;
  filter.value = "all";
  tab.value = "monitors";
  feedback.value = copy.added;
  dialog.value = false;
}

function togglePause(monitor: Monitor): void {
  monitor.paused = !monitor.paused;
  feedback.value = monitor.paused ? copy.pauseFeedback : copy.resumeFeedback;
}
</script>

<template>
  <div class="monitor-app">
    <header class="demo-header monitor-header">
      <div>
        <span class="demo-brand"><span class="monitor-mark"><WlIcon name="activity" :size="20" /></span>{{ copy.brand }}</span>
        <a v-if="!embedded" class="demo-return" :href="applicationRecipesHref(locale)">{{ copy.back }}</a>
      </div>
    </header>

    <main class="demo-content monitor-content">
      <div class="demo-line monitor-heading">
        <div>
          <p class="monitor-workspace">{{ copy.workspace }}</p>
          <h1 class="wl-text-title">{{ copy.title }}</h1>
          <p class="wl-text-muted">{{ copy.intro }}</p>
        </div>
        <WlButton variant="primary" :disabled="monitors.length >= maximumMonitors" @click="startMonitor">
          <template #icon><WlIcon name="plus" :size="17" /></template>
          {{ copy.add }}
        </WlButton>
      </div>

      <div class="monitor-summary" :data-alert="down > 0">
        <WlIcon :name="down ? 'exclamation-circle' : 'check-circle'" :size="25" />
        <div>
          <strong>{{ down ? copy.issues : copy.noIssues }}</strong>
          <p>{{ copy.running(up, monitors.length) }}</p>
        </div>
        <WlButton
          v-if="down"
          size="sm"
          variant="secondary"
          @click="tab = 'incidents'"
        >{{ copy.incidents }}</WlButton>
      </div>

      <p v-if="feedback" class="monitor-feedback" role="status">{{ feedback }}</p>
      <WlTabs v-model="tab" :items="tabs">
        <template #panel="{ item }">
          <div v-if="item.key === 'monitors'" class="monitor-split">
            <section class="monitor-table" :aria-label="copy.monitors">
              <div class="demo-line monitor-list-header">
                <h2 class="wl-text-subheading">{{ copy.monitors }}</h2>
                <WlSegmented
                  v-model="filter"
                  size="sm"
                  :options="filters"
                  :aria-label="copy.filter"
                />
              </div>
              <ul>
                <li v-for="monitor in visible" :key="monitor.id">
                  <button
                    type="button"
                    class="monitor-row"
                    :aria-current="selectedId === monitor.id ? 'true' : undefined"
                    @click="selectMonitor(monitor.id)"
                  >
                    <span class="monitor-row-name">
                      <strong>{{ monitor.label }}</strong>
                      <small>{{ monitor.url }}</small>
                    </span>
                    <WlPill :tone="tones[status(monitor)]" :label="copy.status[status(monitor)]" />
                    <WlIcon name="chevron-right" :size="14" />
                  </button>
                </li>
              </ul>
              <p v-if="!visible.length" class="monitor-no-checks">{{ copy.noIssues }}</p>
            </section>

            <section
              v-if="selected"
              ref="detail"
              tabindex="-1"
              class="monitor-detail demo-panel"
              aria-labelledby="monitor-detail-title"
            >
              <div class="demo-line">
                <h2 id="monitor-detail-title" class="wl-text-subheading">{{ selected.label }}</h2>
                <WlButton
                  size="sm"
                  variant="secondary"
                  :aria-pressed="selected.paused"
                  @click="togglePause(selected)"
                >{{ selected.paused ? copy.resume : copy.pause }}</WlButton>
              </div>
              <p class="monitor-detail-target">{{ selected.url }}</p>
              <p class="monitor-cadence"><WlIcon name="clock" :size="16" /> {{ copy.every(selected.cadence) }}</p>
              <div v-if="checks.length" class="monitor-checks">
                <div class="demo-line">
                  <h3>{{ copy.checkHistory }}</h3>
                  <b>{{ percent.format(succeeded / checks.length) }}</b>
                </div>
                <div
                  class="monitor-samples"
                  role="img"
                  :aria-label="copy.samples(succeeded, checks.length)"
                  :style="{ gridTemplateColumns: 'repeat(' + checks.length + ', minmax(0, 1fr))' }"
                >
                  <span
                    v-for="(sample, index) in checks"
                    :key="index"
                    :data-failed="sample === null"
                    :style="{ blockSize: sample === null ? '100%' : 18 + Math.min(350, sample) / 5 + '%' }"
                    :title="sample === null ? copy.timeout : number.format(sample) + ' ' + copy.ms"
                  ></span>
                </div>
                <div class="demo-line monitor-axis"><span>{{ copy.oldest }}</span><span>{{ copy.latest }}</span></div>
                <dl class="monitor-last">
                  <dt>{{ copy.lastCheck }}</dt>
                  <dd>{{ checks.at(-1) === null ? copy.timeout : number.format(checks.at(-1) ?? 0) + ' ' + copy.ms }}</dd>
                </dl>
              </div>
              <p v-else class="monitor-no-checks">{{ copy.noChecks }}</p>
            </section>
          </div>

          <section v-else-if="item.key === 'incidents'" class="monitor-incident-list" :aria-label="copy.incidents">
            <article class="demo-panel monitor-incident">
              <header class="demo-line">
                <h2 class="wl-text-subheading">{{ copy.activeIncident }}</h2>
                <WlPill :label="acknowledged ? copy.acknowledged : copy.open" :tone="acknowledged ? 'warning' : 'danger'" />
              </header>
              <p class="wl-text-muted">{{ copy.incidentLead }}</p>
              <ol class="monitor-timeline">
                <li v-for="[when, description] in copy.timeline" :key="when"><time>{{ when }}</time>{{ description }}</li>
              </ol>
              <WlButton
                :disabled="acknowledged"
                size="sm"
                variant="secondary"
                @click="acknowledged = true"
              >{{ copy.acknowledge }}</WlButton>
            </article>
            <article class="demo-panel monitor-incident">
              <header class="demo-line">
                <h2 class="wl-text-subheading">{{ copy.closedIncident }}</h2>
                <WlPill :label="copy.resolved" tone="success" />
              </header>
              <p class="wl-text-muted">{{ copy.closedDescription }}</p>
            </article>
          </section>

          <section v-else class="demo-panel monitor-plan" :aria-label="copy.plan">
            <div>
              <h2 class="wl-text-subheading">{{ copy.teamPlan }}</h2>
              <p class="wl-text-muted">{{ copy.planLead }}</p>
            </div>
            <div class="wl-stack" data-space="sm">
              <div class="demo-line"><strong>{{ copy.use }}</strong><span>{{ monitors.length }} / {{ maximumMonitors }}</span></div>
              <WlProgress
                class="wl-fluid"
                :value="monitors.length"
                :max="maximumMonitors"
                :aria-label="copy.use"
              />
              <p class="wl-text-muted">{{ copy.renew }}</p>
            </div>
          </section>
        </template>
      </WlTabs>
    </main>

    <WlDialog v-model:visible="dialog" :header="copy.add" size="sm">
      <form class="demo-dialog-form wl-stack" data-space="md" @submit.prevent="saveMonitor">
        <p class="wl-text-muted">{{ copy.demoHint }}</p>
        <WlField :label="copy.name" required>
          <template #default="{ id }"><WlInput
            :id="id"
            v-model="name"
            maxlength="48"
            required
          /></template>
        </WlField>
        <WlField
          id="monitor-address"
          :label="copy.url"
          :error="error"
          required
          announce-error
        >
          <WlInput
            id="monitor-address"
            v-model="url"
            type="url"
            placeholder="https://status.example/"
            required
            :invalid="Boolean(error)"
            :aria-describedby="error ? 'monitor-address-desc' : undefined"
            @update:model-value="error = ''"
          />
        </WlField>
        <WlField :label="copy.interval">
          <template #default="{ id }"><WlSelect
            :id="id"
            v-model="cadence"
            :options="cadenceOptions"
            option-label="label"
            option-value="value"
          /></template>
        </WlField>
        <div><WlButton type="submit" variant="primary">{{ copy.save }}</WlButton></div>
      </form>
    </WlDialog>
  </div>
</template>

<style scoped src="./monitoring.css"></style>
