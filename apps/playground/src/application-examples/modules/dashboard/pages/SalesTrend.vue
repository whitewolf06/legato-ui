<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
  points: readonly { label: string; revenue: number; previous: number }[];
  compare: boolean;
  currentLabel: string;
  previousLabel: string;
  formatMoney: (value: number) => string;
  formatAxis: (value: number) => string;
}>();
const canvas = ref<HTMLCanvasElement>();
const active = ref<number | null>(null);
const top = computed(() => {
  const max = Math.max(1, ...props.points.map((point) => Math.max(point.revenue, props.compare ? point.previous : 0)));
  const step = 10 ** Math.floor(Math.log10(max / 4));
  return Math.ceil(max / (step * 4)) * step * 4;
});
const ticks = computed(() => [1, 0.75, 0.5, 0.25, 0].map((fraction) => props.formatAxis(fraction * top.value)));
const selected = computed(() => active.value === null ? undefined : props.points[active.value]);
let resize: ResizeObserver | undefined;
let theme: MutationObserver | undefined;

function draw(): void {
  const surface = canvas.value;
  const context = surface?.getContext("2d");
  if (!surface || !context) return;
  const width = surface.clientWidth;
  const height = surface.clientHeight;
  if (!width || !height) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  surface.width = Math.round(width * ratio);
  surface.height = Math.round(height * ratio);
  context.scale(ratio, ratio);
  const style = getComputedStyle(surface);
  const ink = style.getPropertyValue("--wl-accent").trim();
  const secondary = style.getPropertyValue("--wl-info-text").trim();
  const rule = style.getPropertyValue("--wl-border").trim();
  const plotHeight = height - 2;
  const pointX = (index: number) => (index + 0.5) / props.points.length * width;
  const pointY = (value: number) => 1 + plotHeight * (1 - value / top.value);
  const floor = pointY(0);

  context.strokeStyle = rule;
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index++) {
    const y = 1 + plotHeight * index / 4;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  function trace(key: "revenue" | "previous"): void {
    if (!context) return;
    context.beginPath();
    for (const [index, point] of props.points.entries()) {
      const x = pointX(index);
      const y = pointY(point[key]);
      const last = props.points[index - 1];
      if (!last) context.moveTo(x, y);
      else {
        const middle = (pointX(index - 1) + x) / 2;
        context.bezierCurveTo(middle, pointY(last[key]), middle, y, x, y);
      }
    }
  }

  if (props.compare) {
    trace("previous");
    context.strokeStyle = secondary;
    context.globalAlpha = 0.7;
    context.setLineDash([5, 5]);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;
  }
  trace("revenue");
  context.lineTo(pointX(props.points.length - 1), floor);
  context.lineTo(pointX(0), floor);
  context.closePath();
  const gradient = context.createLinearGradient(0, 0, 0, floor);
  gradient.addColorStop(0, ink);
  gradient.addColorStop(1, "transparent");
  context.fillStyle = gradient;
  context.globalAlpha = 0.26;
  context.fill();
  context.globalAlpha = 1;
  trace("revenue");
  context.strokeStyle = ink;
  context.lineWidth = 2.5;
  context.stroke();

  if (active.value !== null && selected.value) {
    const x = pointX(active.value);
    const y = pointY(selected.value.revenue);
    context.strokeStyle = rule;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, floor);
    context.stroke();
    context.fillStyle = ink;
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
  }
}

onMounted(() => {
  if (!canvas.value) return;
  resize = new ResizeObserver(draw);
  resize.observe(canvas.value);
  theme = new MutationObserver(draw);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-wl-theme"] });
  draw();
});
onUnmounted(() => {
  resize?.disconnect();
  theme?.disconnect();
});
watch([() => props.points, () => props.compare], () => {
  active.value = null;
  draw();
}, { flush: "post" });
watch(active, draw);
</script>

<template>
  <div class="sales-trend">
    <div class="sales-trend-axis" aria-hidden="true">
      <span v-for="(tick, index) in ticks" :key="index">{{ tick }}</span>
    </div>
    <div class="sales-trend-body">
      <div class="sales-trend-plot">
        <canvas ref="canvas" aria-hidden="true"></canvas>
        <div class="sales-trend-hit" @pointerleave="active = null">
          <button
            v-for="(point, index) in points"
            :key="point.label"
            type="button"
            :aria-label="point.label + ' · ' + formatMoney(point.revenue) + (compare ? ' / ' + formatMoney(point.previous) : '')"
            @pointerenter="active = index"
            @focus="active = index"
            @blur="active = null"
            @click="active = index"
          ></button>
        </div>
        <div v-if="selected" class="sales-trend-detail" aria-hidden="true">
          <strong>{{ selected.label }}</strong>
          <span>{{ currentLabel }} {{ formatMoney(selected.revenue) }}</span>
          <span v-if="compare">{{ previousLabel }} {{ formatMoney(selected.previous) }}</span>
        </div>
      </div>
      <div class="sales-trend-dates" aria-hidden="true">
        <span v-for="point in points" :key="point.label">{{ point.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sales-trend { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; padding-top: 12px; }
.sales-trend-axis, .sales-trend-dates { color: var(--wl-text-muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.sales-trend-axis { display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 22px; }
.sales-trend-plot { position: relative; height: clamp(157px, 18vw, 211px); }
.sales-trend-plot canvas { display: block; width: 100%; height: 100%; }
.sales-trend-hit { position: absolute; inset: 0; display: flex; }
.sales-trend-hit button { flex: 1; min-width: 0; padding: 0; cursor: crosshair; border: 0; background: transparent; }
.sales-trend-hit button:focus-visible { outline: 1px solid var(--wl-accent); outline-offset: -1px; }
.sales-trend-detail {
  position: absolute;
  display: grid;
  gap: 2px;
  inset-block-start: 6px;
  inset-inline-start: 8px;
  padding: 6px 9px;
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-radius);
  background: var(--wl-bg-raised);
  font-size: 11px;
  pointer-events: none;
}
.sales-trend-dates { display: flex; margin-top: 6px; }
.sales-trend-dates span { flex: 1; min-width: 0; text-align: center; white-space: nowrap; font-size: clamp(9px, .95vw, 11px); }
@media (max-width: 960px) {
  .sales-trend-dates span:nth-child(even):not(:last-child) { visibility: hidden; }
}
@media (max-width: 410px) {
  .sales-trend-dates span:nth-child(2n) { visibility: hidden; }
}
</style>
