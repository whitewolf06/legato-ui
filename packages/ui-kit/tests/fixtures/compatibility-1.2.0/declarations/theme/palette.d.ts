import { WlDesignTokenName } from "../design-system/tokens.generated.js";
import { WlThemeName } from "../design-system/types.js";
import { WlThemeOverrides, WlThemePalette } from "./types.js";
export declare const paletteTokens: Record<keyof WlThemePalette, WlDesignTokenName>;
export declare function baseTheme(name: WlThemeName): {
    readonly name: "gavia";
    readonly label: "Gavia";
    readonly description: "Светлая тема со шрифтом Gavia Sans.";
    readonly colorScheme: "light";
} | {
    readonly name: "white";
    readonly label: "Classic";
    readonly description: "Светлая тема с синим акцентом.";
    readonly colorScheme: "light";
} | {
    readonly name: "graphite";
    readonly label: "Classic Dark";
    readonly description: "Тёмная тема с цветами для статусов.";
    readonly colorScheme: "dark";
} | {
    readonly name: "newspaper";
    readonly label: "Newspaper";
    readonly description: "Светлая тема с тёплым фоном под бумагу.";
    readonly colorScheme: "light";
} | {
    readonly name: "gavia-dark";
    readonly label: "Gavia Dark";
    readonly description: "Тёмная тема с бирюзовым акцентом и шрифтом Gavia Sans.";
    readonly colorScheme: "dark";
} | {
    readonly name: "legato";
    readonly label: "Legato";
    readonly description: "Светлая тема с индиго, бордовым и шафрановым акцентами. Использует шрифт Legato Sans.";
    readonly colorScheme: "light";
} | {
    readonly name: "legato-dark";
    readonly label: "Legato Dark";
    readonly description: "Тёмная тема с чернильным фоном, светлым индиго и акцентами розы и шафрана. Использует шрифт Legato Sans.";
    readonly colorScheme: "dark";
};
export declare function basePalette(theme: WlThemeName): WlThemePalette;
/** Existing Playground palette derivation, shared by every public output. */
export declare function paletteOverrides(palette: WlThemePalette, theme: WlThemeName): WlThemeOverrides;
