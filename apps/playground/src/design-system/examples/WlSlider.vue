<script setup lang="ts">
import { usePlaygroundI18n } from "../../i18n";
const props = defineProps<{ preview?: Record<string, unknown> }>();
const { t } = usePlaygroundI18n();
import { WlSlider } from "legato-ui";
import { computed, ref } from "vue";
const volume = ref(40);
const marked = ref(50);
const range = ref<[number, number]>([20, 80]);
const marks = [0, 25, 50, 75, 100];
const rangeMode = computed(() => props.preview?.range === true);
</script>

<template>
  <div class="wl-stack" data-space="md">
    <template v-if="rangeMode">
      <WlSlider
        v-model="range"
        :min="0"
        :max="100"
        :step="10"
        v-bind="preview"
        range
        :aria-label="t('examples.sliderRange')"
      />
      <p class="wl-text-small">{{ t("examples.sliderRangeValue") }} {{ range.join(' – ') }}</p>
    </template>
    <template v-else>
      <WlSlider
        v-model="volume"
        :min="0"
        :max="100"
        :step="10"
        v-bind="preview"
        :range="false"
        :aria-label="t('examples.volume_0121')"
      />
      <p class="wl-text-small">{{ t("examples.volume_0122") }} {{ volume }}%</p>
    </template>
    <WlSlider
      v-bind="preview"
      v-model="marked"
      :range="false"
      :marks="marks"
      :aria-label="t('examples.sliderMarked')"
    />
    <p class="wl-text-small">{{ t("examples.sliderMarkedValue") }} {{ marked }}</p>
    <template v-if="!rangeMode">
      <WlSlider
        v-bind="preview"
        v-model="range"
        range
        :marks="marks"
        :aria-label="t('examples.sliderRange')"
      />
      <p class="wl-text-small">{{ t("examples.sliderRangeValue") }} {{ range.join(' – ') }}</p>
    </template>
  </div>
</template>
