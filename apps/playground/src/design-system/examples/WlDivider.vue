<script setup lang="ts">
import { usePlaygroundI18n } from "../../i18n";
const props = defineProps<{ preview?: PreviewProps }>();
const { t } = usePlaygroundI18n();
import { WlDivider } from "legato-ui";
import { computed } from "vue";
type PreviewProps = Partial<InstanceType<typeof WlDivider>["$props"]>;
const vertical = computed(() => props.preview?.orientation === "vertical");
</script>

<template>
  <div class="wl-stack" data-space="md">
    <div v-if="vertical" class="wl-inline" data-space="sm">
      <span>{{ t("examples.overview_0000") }}</span>
      <WlDivider v-bind="preview" />
      <span>{{ t("examples.additional_details_0048") }}</span>
    </div>
    <WlDivider v-else v-bind="preview">{{ t("examples.additional_details_0048") }}</WlDivider>
  </div>
</template>
