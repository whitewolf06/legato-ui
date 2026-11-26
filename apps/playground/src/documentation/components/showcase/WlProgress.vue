<script setup lang="ts">
import { usePlaygroundI18n } from "../../../i18n";
const { t } = usePlaygroundI18n();
import { WlButton, WlProgress, type WlTone } from "legato-ui";
import { ref } from "vue";
const value = ref(40);
const tones = ["neutral", "accent", "info", "success", "warning", "danger"] as const satisfies readonly WlTone[];
</script>

<template>
  <div class="wl-stack" data-space="lg">
    <div class="wl-stack" data-space="sm">
      <div v-for="tone in tones" :key="tone" class="showcase-progress-tone">
        <code>{{ tone }}</code>
        <WlProgress :aria-label="tone" :value="65" :tone="tone" />
      </div>
    </div>
    <WlProgress :value="64" :aria-label="t('examples.default_progress_0529')" />
    <WlProgress :value="32" thin :aria-label="t('examples.thin_progress_0530')" />
    <WlProgress :value="100" tone="success" :aria-label="t('examples.completed_operation_0531')" />
    <WlProgress
      :value="value"
      :tone="value === 100 ? 'success' : 'accent'"
      show-value
      :aria-label="t('examples.local_preparation_progress_0532')"
    />
    <div class="wl-inline" data-space="sm">
      <WlButton size="sm" :disabled="value === 100" @click="value = Math.min(100, value + 20)">
        {{ t("examples.add_20_0533") }}
      </WlButton>
      <WlButton size="sm" variant="ghost" @click="value = 0">{{ t("examples.start_again_0534") }}</WlButton>
    </div>
    <p class="wl-text-small" role="status">
      {{ value === 100 ? t("examples.preparation_completed_0535") : t("examples.prepared_0536") + value + '%.' }}
    </p>
  </div>
</template>

<style scoped>
.showcase-progress-tone {
  display: grid;
  grid-template-columns: 8ch minmax(0, 1fr);
  align-items: center;
  gap: var(--wl-space-sm);
}
</style>
