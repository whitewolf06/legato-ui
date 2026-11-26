<script setup lang="ts">
import { WlSegmented } from "legato-ui";
import { computed, ref } from "vue";
import CodePanel from "../design-system/CodePanel.vue";
import { usePlaygroundI18n } from "../i18n";
import { getInstallCommand, installationManagers, type PackageManager } from "../project/installation";

const props = defineProps<{ includeVue?: boolean }>();
const { t } = usePlaygroundI18n();
const manager = ref<string | null>("pnpm");
const command = computed(() => getInstallCommand((manager.value ?? "pnpm") as PackageManager, props.includeVue));
</script>

<template>
  <WlSegmented v-model="manager" :options="installationManagers" :aria-label="t('documentation.strings.s0848')" />
  <CodePanel
    :source="command"
    :title="t('documentation.strings.s1280', { manager: manager ?? 'pnpm' })"
    :expanded="true"
  />
</template>
