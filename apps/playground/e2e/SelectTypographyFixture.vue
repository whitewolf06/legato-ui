<script setup lang="ts">
import { WlAutocomplete, type WlDensity, WlMultiSelect, WlSelect, type WlSizeSm } from "legato-ui";
import { computed, ref } from "vue";
import "legato-ui/styles/primitives.css";

const preview = new URLSearchParams(window.location.search).get("select-typography");
const size = ref<WlSizeSm>("md");
const density = ref<WlDensity>("default");
const state = ref("ready");
const local = ref(false);
const one = ref<string | null>(null);
const many = ref<string[]>([]);
const chips = ref(["Beta"]);
const choices = ["Alpha", "Beta", "A long selection label that should remain readable in the open list"];
const options = computed(() => state.value === "empty" ? [] : choices);
const scale = { "--wl-type-control-size": "18px", "--wl-type-small-size": "14px" };
const overlay = computed(() => local.value ? { overlay: { class: "wl-type-scale", style: scale } } : undefined);
</script>

<template>
  <section data-testid="select-typography-fixture" :class="{ 'select-typography-preview': preview }">
    <template v-if="!preview">
      <label for="select-type-size">Size</label>
      <select id="select-type-size" v-model="size"><option>sm</option><option>md</option><option>lg</option></select>
      <label for="select-type-density">Density</label>
      <select id="select-type-density" v-model="density"><option>default</option><option>compact</option></select>
      <label for="select-type-options">Options</label>
      <select id="select-type-options" v-model="state"><option>ready</option><option>empty</option><option>loading</option></select>
      <input id="select-type-local" v-model="local" type="checkbox" />
      <label for="select-type-local">Local scale</label>
    </template>
    <div
      class="wl-stack"
      :class="{ 'wl-type-scale': local }"
      :style="local ? scale : undefined"
      data-testid="scaled-selects"
    >
      <WlSelect
        v-if="preview !== 'multiselect'"
        v-model="one"
        :options="options"
        :size="size"
        :density="density"
        :loading="state === 'loading'"
        :pt="overlay"
        placeholder="Choose one"
        aria-label="Single value"
      />
      <WlMultiSelect
        v-if="!preview"
        v-model="many"
        :options="options"
        :size="size"
        :density="density"
        :loading="state === 'loading'"
        :pt="overlay"
        placeholder="Choose several"
        aria-label="Multiple values"
      />
      <WlMultiSelect
        v-if="preview !== 'select'"
        v-model="chips"
        :options="choices"
        display="chip"
        :size="size"
        :density="density"
        :pt="overlay"
        aria-label="Selected chips"
      />
    </div>
    <WlSelect
      v-if="!preview"
      :options="choices"
      placeholder="Unscaled"
      aria-label="Neighbouring select"
    />
    <WlAutocomplete
      v-if="!preview"
      :suggestions="options"
      :loading="state === 'loading'"
      aria-label="Neighbouring autocomplete"
    />
  </section>
</template>

<style scoped>
.select-typography-preview { min-height: 100vh; padding: 16px; }
</style>
