import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import windows from "./playwright.visual.config";

/** Supplemental official-container baselines; Windows PNGs remain canonical. */
export default defineConfig({
  ...windows,
  grepInvert: /@windows/,
  testIgnore: "select-typography-visual.pw.ts",
  snapshotPathTemplate: "{testDir}/visual-baselines-linux/{projectName}/{arg}{ext}",
  outputDir: fileURLToPath(new URL("./test-results-linux/", import.meta.url)),
  reporter: [["line"], ["json", { outputFile: fileURLToPath(new URL("./test-results-linux/e2e-results.json", import.meta.url)) }]]
});
