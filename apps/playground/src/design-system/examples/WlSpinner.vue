<script setup lang="ts">
import { usePlaygroundI18n } from "../../i18n";
const props = defineProps<{ preview?: Record<string, unknown> }>();
const { t } = usePlaygroundI18n();
import { WlSpinner } from "legato-ui";
</script>

<template>
  <div class="wl-stack" data-space="md">
    <div
      class="wl-inline"
      style="padding: var(--wl-space-md); border-radius: var(--wl-radius-sm)"
      :style="{ background: props.preview?.light ? 'var(--wl-action-primary-bg)' : 'var(--wl-bg-soft)' }"
    >
      <WlSpinner :label="t('examples.loading_material_0123')" v-bind="preview" />
    </div>
  </div>
</template>
