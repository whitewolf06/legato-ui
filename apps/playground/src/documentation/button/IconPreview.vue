<script setup lang="ts">
import { WlButton, WlIcon } from "legato-ui";
import { ref } from "vue";
import { usePlaygroundI18n } from "../../i18n";
defineProps<{ preview?: Record<string, unknown> }>();
const { t } = usePlaygroundI18n();
const count = ref(0);
</script>

<template>
  <div>
    <WlButton v-bind="preview" @click="count++">
      <template #icon>
        <WlIcon name="arrow-right" :size="16" />
      </template>
      {{ t("examples.continue_0253") }}
    </WlButton>
    <p class="wl-text-small wl-text-muted" role="status">{{ t("examples.clicks_0018") }} {{ count }}</p>
  </div>
</template>
