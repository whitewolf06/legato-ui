<script setup lang="ts">
import { resolveWlToken, WlButton, type WlThemeName } from "legato-ui";
import { computed, ref } from "vue";
import { usePlaygroundI18n } from "../../i18n";

const { theme } = defineProps<{ theme: WlThemeName }>();
const { locale } = usePlaygroundI18n();
const language = computed(() => locale.value === "ru" ? "ru" : "en");
const groups = [
  {
    ru: "Поверхности", en: "Surfaces",
    tokens: [
      { name: "--wl-bg", ru: "Фон страницы", en: "Page background" },
      { name: "--wl-bg-raised", ru: "Фон карточки", en: "Card background" },
      { name: "--wl-bg-soft", ru: "Вторичный фон", en: "Secondary background" },
      { name: "--wl-bg-hover", ru: "Наведение", en: "Hover" }
    ]
  },
  {
    ru: "Текст и границы", en: "Text and borders",
    tokens: [
      { name: "--wl-text", ru: "Основной текст", en: "Main text" },
      { name: "--wl-text-muted", ru: "Подписи", en: "Captions" },
      { name: "--wl-border", ru: "Граница", en: "Border" },
      { name: "--wl-focus-color", ru: "Фокус с клавиатуры", en: "Keyboard focus" }
    ]
  },
  {
    ru: "Действия", en: "Actions",
    tokens: [
      { name: "--wl-accent", ru: "Акцент", en: "Accent" },
      { name: "--wl-accent-soft", ru: "Мягкое выделение", en: "Soft highlight" },
      { name: "--wl-action-primary-bg", ru: "Фон главной кнопки", en: "Primary button background" },
      { name: "--wl-action-primary-text", ru: "Текст главной кнопки", en: "Primary button text" }
    ]
  },
  {
    ru: "Статусы", en: "Statuses",
    tokens: [
      { name: "--wl-info-text", ru: "Информация", en: "Information" },
      { name: "--wl-success", ru: "Успех", en: "Success" },
      { name: "--wl-warn", ru: "Предупреждение", en: "Warning" },
      { name: "--wl-danger", ru: "Ошибка или удаление", en: "Error or deletion" }
    ]
  }
] as const;
const actions = [
  { tone: "accent", ru: "Сохранить", en: "Save", ruUse: "Главное действие", enUse: "Primary action" },
  { tone: "neutral", ru: "Отменить", en: "Cancel", ruUse: "Вторичное действие", enUse: "Secondary action" },
  { tone: "info", ru: "Подробнее", en: "Learn more", ruUse: "Информация", enUse: "Information" },
  { tone: "success", ru: "Подтвердить", en: "Confirm", ruUse: "Успешное действие", enUse: "Positive action" },
  { tone: "warning", ru: "Проверить", en: "Review", ruUse: "Требует внимания", enUse: "Needs attention" },
  { tone: "danger", ru: "Удалить", en: "Delete", ruUse: "Опасное действие", enUse: "Destructive action" }
] as const;
const active = ref<typeof actions[number]["tone"]>();
const feedback = computed(() => {
  const action = actions.find(({ tone }) => tone === active.value);
  return action?.[locale.value === "ru" ? "ruUse" : "enUse"] ?? "";
});
</script>

<template>
  <div class="wl-stack" data-space="lg" data-testid="docs-palette-overview">
    <p class="wl-text-body">
      {{ locale === "ru"
        ? "Выбирайте цвет по его назначению. Смените тему в шапке, чтобы сравнить те же роли в другой палитре."
        : "Choose a color by its role. Switch themes in the header to compare the same roles in another palette." }}
    </p>
    <div class="docs-palette-grid">
      <section v-for="group in groups" :key="group.en" class="docs-palette-group">
        <h3 class="wl-text-subheading">{{ group[language] }}</h3>
        <ul>
          <li v-for="token in group.tokens" :key="token.name" :data-palette-token="token.name">
            <span class="docs-palette-swatch" :style="{ backgroundColor: 'var(' + token.name + ')' }" aria-hidden="true"></span>
            <div>
              <strong>{{ token[language] }}</strong>
              <code>{{ token.name }}</code>
            </div>
            <span class="docs-palette-hex">{{ resolveWlToken(token.name, theme) }}</span>
          </li>
        </ul>
      </section>
    </div>
    <div class="docs-palette-actions wl-stack" data-space="sm">
      <h3 class="wl-text-subheading">{{ locale === "ru" ? "Цвет на кнопках" : "Button tones" }}</h3>
      <div class="wl-inline" data-space="sm">
        <WlButton
          v-for="action in actions"
          :key="action.tone"
          size="sm"
          :variant="action.tone === 'neutral' ? 'secondary' : 'primary'"
          :tone="action.tone"
          :aria-pressed="active === action.tone"
          @click="active = action.tone"
        >{{ action[language] }}</WlButton>
      </div>
      <p v-if="feedback" class="wl-text-small wl-text-muted" role="status">{{ feedback }}</p>
    </div>
  </div>
</template>

<style scoped>
.docs-palette-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 345px), 1fr)); gap: var(--wl-space-md); }
.docs-palette-group, .docs-palette-actions {
  padding: var(--wl-space-md);
  background: var(--wl-bg-raised);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-surface);
}
.docs-palette-group ul { margin: 6px 0 0; padding: 0; list-style: none; }
.docs-palette-group li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding-block: 7px;
}
.docs-palette-group li + li { border-top: 1px solid var(--wl-border); }
.docs-palette-group strong, .docs-palette-group code { display: block; font-size: var(--wl-type-small-size); overflow-wrap: anywhere; }
.docs-palette-group code, .docs-palette-hex { color: var(--wl-text-muted); }
.docs-palette-hex { font-family: var(--wl-mono); font-size: 11px; }
.docs-palette-swatch { width: 27px; height: 27px; border: 1px solid var(--wl-border); border-radius: var(--wl-radius); }
</style>
