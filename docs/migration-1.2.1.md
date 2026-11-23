# Upgrading from Legato UI 1.2.0 to 1.2.1

Applications can keep their existing imports, Vue version and component props.

- If your application checks in full theme CSS from `createWlTheme` or the
  `legato-theme` CLI, regenerate the stylesheet from the same configuration.
  The generated selector now applies the base theme’s `text-rendering` setting
  when the theme is nested inside another theme.
- When a named `WlSelect` is disabled, native form submission omits its value.
  Re-enabling the field includes its current value once.

See the [1.2.1 changelog](../CHANGELOG.md#121) for all five fixes.
