<script setup lang="ts">
import { WlButton } from "legato-ui";
import { ref } from "vue";
import { usePlaygroundI18n } from "../../i18n";
defineProps<{ preview?: Record<string, unknown> }>();
const { t } = usePlaygroundI18n();
const submitted = ref(0);
</script>

<template>
  <form @submit.prevent="submitted++" @reset="submitted = 0">
    <WlButton as="button" v-bind="preview">
      {{ t("documentation.buttonExamples.formAction") }}
    </WlButton>
    <p class="wl-text-small wl-text-muted" role="status">{{ t("examples.submissions_0263") }} {{ submitted }}</p>
  </form>
</template>
