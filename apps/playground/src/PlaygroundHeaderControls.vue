<script setup lang="ts">
import type { WlThemeName } from "legato-ui";
import { WlButton, WlIcon, WlSelect } from "legato-ui";
import { computed } from "vue";
import { type PlaygroundLocale, usePlaygroundI18n } from "./i18n";
import { isPlaygroundThemePreference, type PlaygroundThemePreference } from "./themes";

const props = defineProps<{
  theme: WlThemeName;
  themePreference: PlaygroundThemePreference;
  appliedThemeName?: string;
  themeOptions: Array<{ label: string; value: string }>;
}>();
const emit = defineEmits<{
  theme: [theme: PlaygroundThemePreference];
  search: [];
  locale: [locale: PlaygroundLocale];
}>();
const { t, locale } = usePlaygroundI18n();
const currentThemeLabel = computed(() => props.appliedThemeName
  || (props.themePreference === "system" ? t("shell.theme.system") : props.theme));
const languageOptions = [{ label: "EN", value: "en" }, { label: "RU", value: "ru" }];

function selectTheme(value: unknown): void {
  if (isPlaygroundThemePreference(value)) emit("theme", value);
}
function selectLocale(value: unknown): void {
  if (value === "en" || value === "ru") emit("locale", value);
}
</script>

<template>
  <div class="pg-actions">
    <div class="pg-utility-controls">
      <WlButton
        class="pg-search"
        size="sm"
        variant="secondary"
        :aria-label="t('shell.PlaygroundHeader.text130')"
        :title="t('shell.PlaygroundHeader.text131')"
        @click="emit('search')"
      >
        <template #icon><WlIcon name="search" :size="16" /></template>
        <span class="pg-search-text">{{ t('shell.PlaygroundHeader.text132') }}</span>
      </WlButton>
      <div class="pg-theme-control">
        <WlSelect
          class="pg-theme"
          size="sm"
          :model-value="appliedThemeName ? null : themePreference"
          :placeholder="appliedThemeName ? t('shell.themeDraft.active', { name: appliedThemeName }) : undefined"
          :options="themeOptions"
          option-label="label"
          option-value="value"
          :aria-label="t('shell.PlaygroundHeader.text133')"
          :title="t('shell.PlaygroundHeader.text134') + currentThemeLabel"
          data-testid="pg-theme-selector"
          @update:model-value="selectTheme"
        />
        <WlIcon class="pg-theme-mobile-icon" name="sliders-h" :size="18" />
      </div>
    </div>
    <WlSelect
      class="pg-language"
      size="sm"
      :model-value="locale"
      :options="languageOptions"
      option-label="label"
      option-value="value"
      :aria-label="t('shell.language')"
      data-testid="pg-language-selector"
      @update:model-value="selectLocale"
    />
  </div>
</template>

<style scoped>
.pg-actions { display: flex; align-items: center; gap: 8px; }
.pg-utility-controls { display: grid; grid-template-columns: repeat(2, 120px); gap: 8px; }
.pg-search, :deep(.pg-theme) { width: 100%; min-width: 0; }
.pg-search { justify-content: flex-start; text-align: left; color: var(--wl-text-2); background: var(--wl-bg-raised); }
.pg-theme-control { position: relative; min-width: 0; display: flex; align-items: center; }
.pg-theme-mobile-icon { display: none; }
:deep(.pg-language) { width: 68px; min-width: 0; flex: none; }
@media (max-width: 760px) {
  .pg-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .pg-utility-controls { display: contents; }
  .pg-search, :deep(.pg-theme), :deep(.pg-language) { height: 44px; min-height: 44px; width: 100%; max-width: none; }
  .pg-search { padding: 0; justify-content: center; }
  :deep(.pg-language .wl-select__label), :deep(.pg-theme .wl-select__label) { text-align: center; }
}
@media (max-width: 380px) {
  .pg-search-text { display: none; }
  .pg-search :deep(.wl-btn__label) { display: none; }
  :deep(.pg-theme) { padding: 0; }
  :deep(.pg-theme .wl-select__label), :deep(.pg-theme .wl-select__dropdown) { display: none; }
  .pg-theme-mobile-icon { display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
}
</style>
