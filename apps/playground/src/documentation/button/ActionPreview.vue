<script setup lang="ts">
import { WlButton } from "legato-ui";
import { ref } from "vue";
import { usePlaygroundI18n } from "../../i18n";
defineProps<{ preview?: Record<string, unknown> }>();
const { t } = usePlaygroundI18n();
const count = ref(0);
</script>

<template>
  <div>
    <WlButton v-bind="preview" @click="count++">
      {{ t("examples.add_0017") }}
    </WlButton>
    <p class="wl-text-small wl-text-muted" role="status">{{ t("examples.clicks_0018") }} {{ count }}</p>
  </div>
</template>
