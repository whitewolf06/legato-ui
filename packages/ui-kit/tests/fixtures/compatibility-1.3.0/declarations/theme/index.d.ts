import { WlThemeConfig, WlThemeResult } from "./types.js";
export type { WlThemeConfig, WlThemeContrastPair, WlThemeContrastResult, WlThemeOverrides, WlThemePalette, WlThemeResult } from "./types.js";
/** Normalize input settings; v1 snapshots retain their original palette-only meaning. */
export declare function parseWlThemeConfig(value: unknown): WlThemeConfig;
/** Generate deterministic CSS and a report for the selected opaque color pairs. */
export declare function createWlTheme(input: WlThemeConfig): WlThemeResult;
