import { expect, test } from "@playwright/test";
import { wlDesignThemes } from "../../../packages/ui-kit/src/design-system";

for (const { name: theme } of wlDesignThemes) {
  test(`${theme}: component text, spacing and width respond to local theme settings @cross-browser`, async ({ page }) => {
    await page.goto("/e2e.html?review-control-width&review-tabs-order&motion=off", { waitUntil: "domcontentloaded" });
    const root = page.locator("html");
    await root.evaluate((element, name) => element.setAttribute("data-wl-theme", name), theme);
    const field = page.getByTestId("control-width-fixture").locator('[data-fluid="false"]');
    const tab = page.getByRole("tab", { name: "Alpha" });
    const table = page.locator(".wl-table__table").first();
    await expect(tab).toHaveCSS("font-size", "13.5px");
    await expect(table).toHaveCSS("font-size", "13px");
    await expect(field.locator(".wl-checkline")).toHaveCSS("max-width", "380px");
    await expect(field.locator(".wl-cal")).toHaveCSS("max-width", "380px");
    await expect(field.locator(".wl-progress")).toHaveCSS("max-width", "320px");
    const fluid = page.getByTestId("control-width-fixture").locator('[data-fluid="true"]');
    for (const selector of [".wl-checkline", ".wl-cal", ".wl-progress", ".wl-color-picker__grid"]) {
      await expect(fluid.locator(selector)).toHaveCSS("max-width", "none");
    }

    await expect(field.locator(".wl-steps")).toHaveCSS("max-width", "100%");
    await expect(fluid.locator(".wl-steps")).toHaveCSS("max-width", "none");
    await root.evaluate((element) => {
      element.style.fontSize = "20px";
    });
    await field.evaluate((element) => {
      element.classList.add("wl-type-scale");
      element.style.setProperty("--wl-type-label-size", "1.1rem");
      element.style.setProperty("--wl-type-control-size", "1.15rem");
      element.style.setProperty("--wl-type-small-size", ".9rem");
      element.style.setProperty("--wl-space-md", "1rem");
    });
    await expect(field.locator(".wl-field__label")).toHaveCSS("font-size", "22px");
    await expect(field.locator(".wl-field__hint")).toHaveCSS("font-size", "18px");
    const input = field.getByRole("textbox", { name: "Input", exact: true });
    await expect(input).toHaveCSS("padding-left", "20px");
    await expect(input).toHaveCSS("font-size", "23px");
    await expect(tab).toHaveCSS("font-size", "13.5px");
    await fluid.locator(".wl-cal").evaluate((element) => element.style.setProperty("--wl-calendar-max-width", "18rem"));
    await expect(fluid.locator(".wl-cal")).toHaveCSS("max-width", "360px");

    await root.evaluate((element) => {
      element.classList.add("wl-type-scale");
      element.style.setProperty("--wl-type-control-size", "2rem");
      element.style.setProperty("--wl-type-body-size", "1rem");
      element.style.setProperty("--wl-type-subheading-size", "1.2rem");
    });
    await expect(tab).toHaveCSS("font-size", "40px");
    await expect(table).toHaveCSS("font-size", "20px");
    await expect(field.locator(".wl-badge--dot")).toHaveCSS("min-height", "0px");
    const fits = await tab.evaluate((element) => {
      const text = document.createRange();
      text.selectNodeContents(element);
      return text.getBoundingClientRect().height <= element.getBoundingClientRect().height + 1;
    });
    expect(fits).toBe(true);
    await page.locator("#dialog-static-open").click();
    await expect(page.getByRole("dialog").locator(".wl-dialog__title")).toHaveCSS("font-size", "24px");
  });
}
