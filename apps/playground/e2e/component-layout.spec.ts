import { expect, type Page, test } from "@playwright/test";
import { russianPlaygroundUrl } from "./playground-url";

async function preview(page: Page, baseURL: string | undefined, name: string) {
  const url = new URL(baseURL ?? "http://127.0.0.1:4173/");
  url.search = "?view=docs&component=" + name + "&theme=legato";
  await page.goto(russianPlaygroundUrl(url.href), { waitUntil: "domcontentloaded" });
  const stage = page.locator(".docs-content .docs-example-stage").first();
  await expect(stage).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return stage;
}

test("checkbox labels align and every permissions heading sits above its panel", async ({ page, baseURL }) => {
  const stage = await preview(page, baseURL, "WlCheckbox");
  const row = stage.locator(".wl-checkline").first();
  const offset = await row.evaluate((node) => {
    const label = node.querySelector(".wl-checkline__label")!;
    const marker = node.querySelector(".wl-checkbox__box")!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    return Math.abs((text.top + text.bottom - marker.top - marker.bottom) / 2);
  });
  expect(offset).toBeLessThan(1.5);
  const permissions = page.locator(".docs-content").getByRole("group", { name: "Разрешения", exact: true });
  await expect(permissions).toHaveCount(3);
  const groups = await permissions.evaluateAll((nodes) => nodes.map((node) => {
    const legend = node.querySelector("legend")!;
    const panel = node.querySelector(".wl-surface")!;
    return {
      legendGap: panel.getBoundingClientRect().top - legend.getBoundingClientRect().bottom,
      fieldsetBorder: getComputedStyle(node).borderTopStyle,
      panelBorder: getComputedStyle(panel).borderTopStyle,
      panelPadding: Number.parseFloat(getComputedStyle(panel).paddingInlineStart)
    };
  }));
  for (const group of groups) {
    expect(group.legendGap).toBeGreaterThan(0);
    expect(group.fieldsetBorder).toBe("none");
    expect(group.panelBorder).toBe("solid");
    expect(group.panelPadding).toBeGreaterThan(0);
  }
});

test("a narrow alert keeps the close button beside the title and wraps the action", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await preview(page, baseURL, "WlAlert");
  const alert = page.locator('[data-docs-component-extra="WlAlert"] .wl-alert[data-tone="danger"]');
  await expect(alert).toBeVisible();
  const geometry = await alert.evaluate((element) => {
    const body = element.querySelector(".wl-alert__body")!.getBoundingClientRect();
    const action = element.querySelector(".wl-alert__action")!.getBoundingClientRect();
    const close = element.querySelector(".wl-alert__close")!.getBoundingClientRect();
    return {
      textWidth: body.width,
      actionGap: action.top - body.bottom,
      actionOffset: Math.abs(action.left - body.left),
      closeOffset: Math.abs(close.top - body.top)
    };
  });
  expect(geometry.textWidth).toBeGreaterThanOrEqual(160);
  expect(geometry.actionGap).toBeGreaterThan(0);
  expect(geometry.actionOffset).toBeLessThanOrEqual(1);
  expect(geometry.closeOffset).toBeLessThanOrEqual(2);
  await alert.getByRole("button", { name: "Скрыть сообщение об ошибке", exact: true }).click();
  await expect(alert).toHaveCount(0);
});

for (const name of ["WlCheckboxGroup", "WlRadioGroup"]) {
  test(`the ${name} example applies its direction and invalid controls`, async ({ page, baseURL }) => {
    const stage = await preview(page, baseURL, name);
    const fields = page.locator(".docs-example-controls").first();
    const group = stage.locator(".wl-choice-group");
    await expect(group).toHaveAttribute("data-orientation", "horizontal");
    await fields.getByRole("combobox", { name: /orientation/ }).click();
    await page.getByRole("option", { name: "vertical", exact: true }).click();
    await expect(group).toHaveAttribute("data-orientation", "vertical");
    const states = page.locator('[data-docs-example="example-states"]');
    const selection = states.locator(".docs-example-stage .wl-choice-group");
    const invalid = states.getByRole("checkbox", { name: "invalid", exact: true });
    await expect(selection).not.toHaveAttribute("aria-invalid", "true");
    await invalid.check();
    await expect(selection).toHaveAttribute("aria-invalid", "true");
    await invalid.uncheck();
    await expect(selection).not.toHaveAttribute("aria-invalid", "true");
  });
}

test("the tags example enforces the limit from its settings", async ({ page, baseURL }) => {
  const stage = await preview(page, baseURL, "WlTagsInput");
  const max = page.locator(".docs-example-controls").first().getByRole("spinbutton", { name: /max/ });
  await max.fill("5");
  await max.press("Enter");
  const input = stage.locator(".wl-tags-input input");
  for (const label of ["React", "Angular", "Svelte", "Sass", "Less"]) {
    await input.fill(label);
    await input.press("Enter");
  }
  await expect(stage.locator("output")).toHaveText("Vue, React, Angular, Svelte, Sass");
});

test("the slider example shows a pair of limits after switching to a range", async ({ page, baseURL }) => {
  await preview(page, baseURL, "WlSlider");
  const section = page.locator('[data-docs-example="example-selection"]');
  const range = section.getByRole("checkbox", { name: "range", exact: true });
  const stage = section.locator(".docs-example-stage");
  await range.check();
  await stage.getByRole("slider").first().press("ArrowRight");
  await expect(stage.locator("p").first()).toHaveText("Диапазон: 30 – 80");
  await range.uncheck();
  await expect(stage.locator("p").first()).toHaveText("Громкость: 40%");
});

test("an avatar in a stretched stack keeps its presence indicator next to the portrait", async ({ page, baseURL }) => {
  const stage = await preview(page, baseURL, "WlAvatar");
  const avatar = stage.locator(".wl-avatar-wrap").first();
  const distance = await avatar.evaluate((node) => {
    const portrait = node.querySelector(".wl-avatar")!.getBoundingClientRect();
    const indicator = node.querySelector(".wl-avatar__presence")!.getBoundingClientRect();
    return Math.abs(indicator.right - portrait.right);
  });
  expect(distance).toBeLessThanOrEqual(2);
});

test("a narrow field label keeps the optional annotation intact", async ({ page, baseURL }) => {
  const stage = await preview(page, baseURL, "WlField");
  const annotation = stage.locator(".wl-field__optional").first();
  expect(await annotation.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length;
  })).toBe(1);
});

test("long horizontal step descriptions fit without overlapping the next step", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 990 });
  const stage = await preview(page, baseURL, "WlSteps");
  const steps = stage.locator('.wl-steps[data-orientation="horizontal"] .wl-steps__step');
  await expect(steps).toHaveCount(3);
  const clearances = await steps.evaluateAll((nodes) => nodes.slice(1).map((node, index) =>
    node.getBoundingClientRect().left - nodes[index]!.getBoundingClientRect().right
  ));
  expect(Math.min(...clearances)).toBeGreaterThan(0);
});

test("autocomplete keeps the clear button within the field border", async ({ page, baseURL }) => {
  const stage = await preview(page, baseURL, "WlAutocomplete");
  const clear = stage.getByRole("button", { name: "Очистить", exact: true });
  await expect(clear).toHaveCSS("border-top-width", "1px");
  await expect(clear).toHaveCSS("border-bottom-width", "1px");
  await clear.click();
  await expect(stage.getByRole("combobox")).toHaveValue("");
});

test("multiselect chips keep a visible gap", async ({ page, baseURL }) => {
  const stage = await preview(page, baseURL, "WlMultiSelect");
  const chips = stage.locator(".wl-multiselect__value-chip");
  await expect(chips).toHaveCount(2);
  const gap = await chips.evaluateAll(([first, second]) =>
    second!.getBoundingClientRect().left - first!.getBoundingClientRect().right
  );
  expect(gap).toBeGreaterThan(1);
});
