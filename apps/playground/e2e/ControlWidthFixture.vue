<script setup lang="ts">
import { WlAccordion, WlAutocomplete, WlBadge, WlCalendar, WlCheckbox, WlColorPicker, WlField, WlInput, WlMultiSelect, WlNumberInput, WlProgress, WlSelect, WlSlider, WlSteps, WlTextarea } from "legato-ui";
import "legato-ui/styles/primitives.css";

const options = ["Alpha", "Beta"];
const marks = [{ value: 0, label: "0" }, { value: 100, label: "100" }];
</script>

<template>
  <section data-testid="control-width-fixture" style="width: min(100%, 640px)">
    <div
      v-for="fluid in [false, true]"
      :key="String(fluid)"
      :class="{ 'wl-fluid': fluid }"
      :data-fluid="fluid"
    >
      <WlField v-slot="field" label="Input" hint="Enter a value"><WlInput :id="field.id" /></WlField>
      <WlSelect :options="options" aria-label="Select" />
      <WlMultiSelect :options="options" aria-label="Multiple" />
      <WlAutocomplete :suggestions="options" aria-label="Autocomplete" />
      <WlTextarea aria-label="Textarea" />
      <WlAccordion :items="[{ key: 'one', title: 'Section', content: 'Content' }]" />
      <WlSlider :model-value="50" aria-label="Slider" />
      <WlSlider :model-value="50" :marks="marks" aria-label="Marked slider" />
      <WlSlider
        :model-value="[20, 80]"
        range
        :marks="marks"
        aria-label="Range slider"
      />
      <WlNumberInput aria-label="Number" />
      <WlCheckbox>Choice</WlCheckbox>
      <WlCalendar month="2026-11" />
      <WlProgress :value="60" aria-label="Progress" />
      <WlSteps :items="[{ label: 'First step' }, { label: 'Review' }]" />
      <WlColorPicker />
      <WlBadge value="42" />
      <WlBadge dot />
    </div>
  </section>
</template>
