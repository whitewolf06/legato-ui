import { expect, test } from "@playwright/test";
import { russianPlaygroundUrl } from "./playground-url";

const tones = ["neutral", "accent", "info", "success", "warning", "danger"];
const examples = [
  { name: "WlLink", part: "link", suffix: "" },
  { name: "WlTag", part: "tag", suffix: "" },
  { name: "WlIconButton", part: "icon-button", suffix: "" },
  { name: "WlProgress", part: "progress", suffix: " .wl-progress__value" }
];

for (const theme of ["legato", "legato-dark"]) {
  test(`component tone comparisons display all six distinct colors in ${theme}`, async ({ page }) => {
    for (const example of examples) {
      await page.goto(russianPlaygroundUrl(`/?view=docs&component=${example.name}&theme=${theme}`));
      const preview = page.getByTestId("docs-component-extra-preview");
      const colors: string[] = [];
      for (const tone of tones) {
        const target = preview.locator(`[data-wl="${example.part}"][data-tone="${tone}"]${example.suffix}`).first();
        await expect(target).toBeVisible();
        colors.push(await target.evaluate((element) => {
          const style = getComputedStyle(element);
          return style.color + "/" + style.backgroundColor;
        }));
      }
      expect(new Set(colors).size, example.name).toBe(tones.length);
    }
  });
}
