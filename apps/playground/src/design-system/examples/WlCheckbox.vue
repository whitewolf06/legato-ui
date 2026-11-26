<script setup lang="ts">
import { usePlaygroundI18n } from "../../i18n";
defineProps<{ preview?: Record<string, unknown> }>();
const { t } = usePlaygroundI18n();
import { WlCheckbox } from "legato-ui";
import { ref } from "vue";
const value = ref(true);
const permissions = ref<number[]>([1]);
</script>

<template>
  <div class="wl-stack" data-space="md">
    <WlCheckbox v-model="value" v-bind="preview">{{ t("examples.receive_updates_0027") }}</WlCheckbox>
    <fieldset class="wl-choice-group">
      <legend class="wl-choice-group__legend wl-text-label">{{ t("documentation.strings.generatedWlCheckboxGroupLabel") }}</legend>
      <div class="wl-surface wl-stack" data-space="sm">
        <WlCheckbox v-model="permissions" :value="1" size="sm">{{ t("documentation.strings.generatedWlCheckboxGroupRead") }}</WlCheckbox>
        <WlCheckbox v-model="permissions" :value="2" size="sm">{{ t("documentation.strings.generatedWlCheckboxGroupShare") }}</WlCheckbox>
        <output class="wl-text-small wl-text-muted" :aria-label="t('documentation.strings.generatedWlCheckboxGroupLabel')">
          <code>{{ JSON.stringify(permissions) }}</code>
        </output>
      </div>
    </fieldset>
  </div>
</template>
