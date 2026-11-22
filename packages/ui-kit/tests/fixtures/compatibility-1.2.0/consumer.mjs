import { createWlTheme, parseWlThemeConfig } from "legato-ui/theme";

/** @type {unknown} */
const savedTheme = {
  schemaVersion: 2,
  name: "release-brand",
  baseTheme: "legato",
  mode: "delta",
  overrides: { "--wl-input-radius": "9px" }
};

const config = parseWlThemeConfig(savedTheme);
const theme = createWlTheme(config);
export const themeCss = theme.css;
if (theme.overrides["--wl-input-radius"] !== "9px"
  || !themeCss.includes('[data-wl-theme="legato"][data-wl-brand="release-brand"]')
  || !themeCss.includes("--wl-input-radius: 9px;")) {
  throw new Error("The generated delta theme must apply the consumer's radius override on its branded Legato selector.");
}
