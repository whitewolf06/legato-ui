import { expect, test } from "@playwright/test";
import assert from "node:assert/strict";

for (const theme of ["legato", "legato-dark"]) {
  for (const [component, keys] of [["select", ["ArrowDown", "Enter", "ArrowDown"]], ["multiselect", ["ArrowDown"]]] as const) {
    test(`${theme} open ${component} keeps its 1.2.1 typography`, async ({ page }) => {
      await page.goto(`/e2e.html?select-typography=${component}&motion=off`);
      await page.locator("html").evaluate((el, name) => el.setAttribute("data-wl-theme", name), theme);
      const group = page.getByTestId("scaled-selects");
      const field = group.locator(`.wl-${component}`);
      const control = group.getByRole("combobox");
      for (const key of keys) await control.press(key);
      const panel = page.locator(`.wl-${component}-overlay`);
      await expect(panel.getByRole("option")).toHaveCount(3);
      await expect(field).toHaveCSS("font-family", /Legato Sans Core/);
      const loaded = await page.evaluate(async () => {
        const faces = await document.fonts.load('400 16px "Legato Sans Core"', "Alpha Beta Выбор");
        await document.fonts.ready;
        return faces.length > 0 && faces.every((face) => face.status === "loaded");
      });
      expect(loaded).toBe(true);
      const viewport = page.viewportSize()!;
      await page.mouse.move(viewport.width - 2, 2);
      const [a, b] = await Promise.all([field.boundingBox(), panel.boundingBox()]);
      assert(a && b, "Expected the field and its open panel to be visible");
      // Include the focus ring and the gap around the teleported panel.
      const x = Math.max(0, Math.floor(Math.min(a.x, b.x)) - 5);
      const y = Math.max(0, Math.floor(Math.min(a.y, b.y)) - 5);
      const width = Math.min(viewport.width, Math.ceil(Math.max(a.x + a.width, b.x + b.width)) + 5) - x;
      const height = Math.min(viewport.height, Math.ceil(Math.max(a.y + a.height, b.y + b.height)) + 5) - y;
      await expect(page).toHaveScreenshot(`${theme}-${component}-typography.png`, { clip: { x, y, width, height } });
    });
  }
}
