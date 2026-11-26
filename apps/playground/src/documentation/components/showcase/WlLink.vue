<script setup lang="ts">
import { WlLink } from "legato-ui";
import { usePlaygroundI18n } from "../../../i18n";
const { t } = usePlaygroundI18n();
</script>

<template>
  <div class="wl-stack" data-space="md">
    <div class="wl-inline" data-space="md">
      <WlLink tone="neutral" href="https://legato-ui.ru/">neutral</WlLink>
      <WlLink tone="accent" href="https://legato-ui.ru/">accent</WlLink>
      <WlLink tone="info" href="https://legato-ui.ru/">info</WlLink>
      <WlLink tone="success" href="https://legato-ui.ru/">success</WlLink>
      <WlLink tone="warning" href="https://legato-ui.ru/">warning</WlLink>
      <WlLink tone="danger" href="https://legato-ui.ru/">danger</WlLink>
    </div>
    <WlLink href="?view=docs" disabled>{{ t('documentation.strings.review_link_internal') }}</WlLink>
    <WlLink href="https://github.com/whitewolf06/legato-ui" external>{{ t('documentation.strings.review_link_external') }}</WlLink>
  </div>
</template>
