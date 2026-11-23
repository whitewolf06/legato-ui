import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { createWlTheme } from "../../../packages/ui-kit/src/theme/index";

test("a nested full Legato theme applies its own text-rendering inside Classic", async ({ page }) => {
  await page.setContent(`
    <main data-wl-theme="white">
      <p>Classic text</p>
      <section data-wl-theme="custom-legato"><p>Full theme text</p></section>
      <section data-wl-theme="white" data-wl-brand="reading"><p>Delta text</p></section>
    </main>
  `);
  await page.addStyleTag({ path: fileURLToPath(new URL("../../../packages/ui-kit/themes/white.css", import.meta.url)) });
  const full = createWlTheme({ schemaVersion: 2, name: "custom-legato", baseTheme: "legato", mode: "full" });
  const delta = createWlTheme({
    schemaVersion: 2, name: "reading", baseTheme: "white", mode: "delta",
    overrides: { "--wl-type-text-rendering": "optimizeSpeed" }
  });
  await page.addStyleTag({ content: full.css });
  await page.addStyleTag({ content: delta.css });

  await expect(page.getByText("Classic text")).toHaveCSS("text-rendering", /^optimizeLegibility$/i);
  await expect(page.getByText("Delta text")).toHaveCSS("text-rendering", /^optimizeSpeed$/i);
  await expect(page.getByText("Full theme text")).toHaveCSS("text-rendering", /^geometricPrecision$/i);
});
