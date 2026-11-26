# Upgrading from Legato UI 1.3.0 to 1.3.1

Update `legato-ui` to `^1.3.1`. Existing imports, props, events, slots and Vue peer requirements carry forward.

## Semantic colors

`WlButton`, `WlIconButton`, links, alerts, labels and progress indicators use distinct semantic colors. The Legato themes use blue for information, amber for warnings and cherry red for destructive actions. Check custom theme overrides around statuses, including `--wl-info-text` and the new `--wl-info-soft` surface.

## Selection and chips

`WlMultiSelect` adds a checkmark to selected options in its default slot content. The keyboard cursor uses a separate focus indicator. Applications that supply an `option` slot continue to render their own row content. The small `WlChip` count aligns vertically with its label.
