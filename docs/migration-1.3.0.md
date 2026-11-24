# Upgrading from Legato UI 1.2.1 to 1.3.0

Update `legato-ui` to `^1.3.0`. Existing component imports, props and Vue peer requirements carry forward.

## Text and spacing

Applications using `wl-type-scale` now apply their configured text sizes to more components. In `WlSelect` and `WlMultiSelect`, medium fields and list options use `--wl-type-control-size`. Chips, loading messages and empty messages use `--wl-type-small-size`. Review forms, menus, tabs and tables where a theme customizes these roles.

To use the scale, import `legato-ui/styles/primitives.css` and apply `wl-type-scale` to the theme root or a section. Set the role values on that element. For a locally themed select, pass the same class and overrides to its `pt.overlay` so the list attached to `body` inherits them. Applications using the default typography can keep their current setup.

Standard component insets and gaps now follow the `--wl-space-*` tokens. Check existing spacing overrides on dense layouts. `--wl-space-unit` controls intermediate distances.

## Widths

`wl-fluid` now removes width caps on checkbox and radio labels, progress bars, calendars and color swatches. Steps fill their container by default. To keep a narrower Steps layout, set `--wl-steps-max-width` locally.

See the [sizing examples](reference/design-system.md#component-text-spacing-and-width) for a `rem`-based theme and local width overrides.
