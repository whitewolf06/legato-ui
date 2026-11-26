<script setup lang="ts">
import { usePlaygroundI18n } from "../../i18n";
const { t } = usePlaygroundI18n();
import { WlButton, type WlButtonVariant, type WlTone } from "legato-ui";
import { ref } from "vue";
// The public union makes a missing or unsupported variant a type error.
const labels = {
  primary: t("examples.create_0290"),
  secondary: t("examples.draft_0291"),
  ghost: t("examples.cancel_0038"),
  soft: t("examples.share_0292"),
  link: t("examples.learn_more_0294")
} satisfies Record<WlButtonVariant, string>;
const variants = Object.keys(labels) as WlButtonVariant[];
const tones = ["neutral", "accent", "info", "success", "warning", "danger"] as const satisfies readonly WlTone[];
const lastAction = ref("");
</script>

<template>
  <div class="wl-stack" data-space="lg">
    <div class="button-variant-grid">
      <div
        v-for="variant in variants"
        :key="variant"
        class="wl-stack"
        data-space="sm"
      >
        <div><WlButton :variant="variant" @click="lastAction = labels[variant]">{{ labels[variant] }}</WlButton></div>
        <code class="wl-text-small">{{ variant }}</code>
      </div>
      <div class="wl-stack" data-space="sm">
        <div>
          <WlButton variant="primary" tone="danger" @click="lastAction = t('examples.delete_0037')">
            {{ t('examples.delete_0037') }}
          </WlButton>
        </div>
        <code class="wl-text-small">primary + danger</code>
      </div>
      <div class="wl-stack" data-space="sm">
        <div>
          <WlButton variant="ghost" tone="danger" @click="lastAction = t('examples.delete_quietly_0293')">
            {{ t('examples.delete_quietly_0293') }}
          </WlButton>
        </div>
        <code class="wl-text-small">ghost + danger</code>
      </div>
      <div class="wl-stack" data-space="sm">
        <div>
          <WlButton variant="soft" tone="danger" @click="lastAction = t('examples.archive_0113')">
            {{ t('examples.archive_0113') }}
          </WlButton>
        </div>
        <code class="wl-text-small">soft + danger</code>
      </div>
    </div>
    <fieldset class="button-tone-comparison">
      <legend class="wl-text-label">{{ t("examples.buttonPrimaryTones") }}</legend>
      <div class="wl-inline" data-space="sm">
        <WlButton
          v-for="tone in tones"
          :key="tone"
          variant="primary"
          :tone="tone"
          @click="lastAction = tone"
        >{{ tone }}</WlButton>
      </div>
    </fieldset>
    <p class="wl-text-small wl-text-muted" role="status">
      {{ lastAction
        ? t("examples.last_action_0277") + lastAction
        : t("examples.choose_any_variant_all_eight_buttons_perform_a_local_action_0295") }}
    </p>
  </div>
</template>

<style scoped>
.button-variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
  gap: var(--wl-space-lg);
  align-items: start;
}
.button-tone-comparison { min-inline-size: 0; margin: 0; padding: 0; border: 0; }
.button-tone-comparison legend { padding: 0 0 var(--wl-space-sm); }
</style>
