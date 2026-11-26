<template>
  <div class="docs-example-frame">
    <slot></slot>
  </div>
</template>

<style>
.docs-example-frame {
  min-width: 0;
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-surface);
  background: var(--wl-bg);
}
.docs-example-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wl-space-sm);
  padding: var(--wl-space-sm) var(--wl-space-md);
  border-bottom: 1px solid var(--wl-border);
}
.docs-example-field { display: inline-flex; align-items: stretch; gap: var(--wl-space-xs); max-width: 100%; min-width: 0; }
.docs-example-field > span {
  display: inline-flex;
  align-items: center;
  padding-inline: var(--wl-space-sm);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-control);
  color: var(--wl-text-muted);
  background: var(--wl-bg-soft);
  font: var(--wl-type-small-size)/1.4 var(--wl-mono), monospace;
}
.docs-example-field > :is(.wl-select, .wl-input-wrap, .wl-stepper) {
  flex: 0 1 auto;
  width: auto;
  min-width: 0;
}
.docs-example-reset { margin-inline-start: auto; color: var(--wl-text-muted); }
.docs-example-stage {
  display: grid;
  align-items: center;
  min-width: 0;
  min-height: 8rem;
  padding: var(--wl-space-lg);
  overflow-wrap: anywhere;
}
.docs-example-stage--centered { justify-items: center; }
.docs-example-stage > * { min-width: 0; max-width: 100%; }
</style>
