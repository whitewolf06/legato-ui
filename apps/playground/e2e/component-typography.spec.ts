import { expect, type Locator, type Page, test } from "@playwright/test";
import { wlDesignThemes } from "../../../packages/ui-kit/src/design-system";

const sizes = [
  [".wl-card__title", 14, 22], [".wl-card__subtitle", 12.5, 14], [".wl-card__content", 13.5, 18],
  [".wl-acc__summary", 13.5, 18], [".wl-acc__body", 13, 18], [".wl-alert__text", 13, 18], [".wl-alert__title", 13, 22],
  ['.wl-segmented[data-size="md"] .wl-segmented__item', 13, 18],
  [".wl-select__label", 13.5, 18], [".wl-multiselect__chip-label", 12, 14]
] as const;

for (const { name: theme } of wlDesignThemes) {
  test(`${theme}: semantic component typography is opt-in and enlarged text fits @cross-browser`, async ({ page }) => {
    await page.goto(`/?view=docs&section=typography&theme=${theme}&lang=en`, { waitUntil: "domcontentloaded" });
    const example = page.getByTestId("semantic-component-example");
    // This route lazy-loads the example and its translations before sizes can be measured.
    await example.waitFor({ state: "visible" });
    for (const [selector, oldSize] of sizes) {
      await expect(example.locator(selector).first()).toHaveCSS("font-size", `${oldSize}px`);
    }
    // Small Segmented already followed --wl-type-small-size before this feature.
    const small = example.locator('.wl-segmented[data-size="sm"]');
    await expect(small.locator("button").first()).toHaveCSS("font-size", "14px");
    await small.evaluate((element) => {
      (element as HTMLElement).style.setProperty("--wl-segmented-sm-font-size", "15px");
    });
    await expect(small.locator("button").first()).toHaveCSS("font-size", "15px");
    await small.evaluate((element) => {
      (element as HTMLElement).style.removeProperty("--wl-segmented-sm-font-size");
    });
    await page.getByRole("checkbox", { name: "Use semantic component typography (wl-type-scale)", exact: true }).check();
    for (const [selector, , scaledSize] of sizes) {
      await expect(example.locator(selector).first()).toHaveCSS("font-size", `${scaledSize}px`);
    }
    for (const button of await example.locator(".wl-segmented__item").all()) {
      const fits = await button.evaluate((element) => {
        const css = getComputedStyle(element);
        return element.getBoundingClientRect().height + 1 >= Number.parseFloat(css.lineHeight)
          + Number.parseFloat(css.paddingTop) + Number.parseFloat(css.paddingBottom);
      });
      expect(fits).toBe(true);
    }
    const content = example.locator(".wl-card__content");
    await content.evaluate((element) => {
      (element as HTMLElement).style.setProperty("--wl-card-content-font-size", "21px");
    });
    await expect(content).toHaveCSS("font-size", "21px");
    for (const control of await example.getByRole("combobox").all()) {
      const list = await openSelectList(page, control);
      await expect(list.getByRole("option").first()).toHaveCSS("font-size", "18px");
      await control.press("Escape");
    }
  });
}

async function selectTypographyFixture(page: Page, theme: string) {
  await page.goto("/e2e.html?select-typography&motion=off", { waitUntil: "domcontentloaded" });
  await page.locator("html").evaluate((root, value) => root.setAttribute("data-wl-theme", value), theme);
  const fixture = page.getByTestId("select-typography-fixture");
  await expect(fixture).toBeVisible();
  return fixture;
}

function fontSizes(elements: Locator) {
  return elements.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fontSize));
}

async function openSelectList(page: Page, control: Locator) {
  await control.press("ArrowDown");
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(control).toHaveAttribute("aria-controls", (await list.getAttribute("id"))!);
  return list;
}

for (const { name: theme } of wlDesignThemes) {
  test(`${theme}: selection typography retains 1.2 field, option and chip sizes`, async ({ page }) => {
    const fixture = await selectTypographyFixture(page, theme);
    const group = fixture.getByTestId("scaled-selects");
    const labels = group.locator('[data-placeholder="true"]');
    const chip = group.locator(".wl-multiselect__chip");
    const fields = group.locator(".wl-select, .wl-multiselect").filter({ has: page.locator('[data-placeholder="true"]') });
    await group.evaluate((element) => element.style.setProperty("width", "320px"));
    for (const [size, font, normal, compact] of [["sm", "12.5px", 32, 28], ["md", "13.5px", 40, 34], ["lg", "14.5px", 48, 42]] as const) {
      await fixture.getByLabel("Size", { exact: true }).selectOption(size);
      for (const [density, height] of [["default", normal], ["compact", compact]] as const) {
        await fixture.getByLabel("Density", { exact: true }).selectOption(density);
        expect(await fontSizes(labels)).toEqual([font, font]);
        const heights = await fields.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
        expect(heights, size + " " + density).toEqual([height, height]);
        expect(await fontSizes(chip)).toEqual(["12px"]);
        await expect(chip).toHaveCSS("height", "24px");
      }
    }
    await fixture.getByLabel("Size", { exact: true }).selectOption("md");
    await group.evaluate((element) => element.style.setProperty("--wl-input-font-size", "17px"));
    expect(await fontSizes(labels)).toEqual(["17px", "17px"]);

    for (const density of ["default", "compact"]) {
      await fixture.getByLabel("Density", { exact: true }).selectOption(density);
      for (const name of ["Single value", "Multiple values"]) {
        const control = group.getByRole("combobox", { name, exact: true });
        const list = await openSelectList(page, control);
        const options = list.getByRole("option");
        expect(await fontSizes(options)).toEqual(["13.5px", "13.5px", "13.5px"]);
        // An unwrapped option on 1.2.1 measured 35.5625 CSS pixels in every theme.
        expect((await options.first().boundingBox())!.height).toBeCloseTo(35.56, 1);
        await control.press("Escape");
      }
    }
    for (const state of ["empty", "loading"]) {
      await fixture.getByLabel("Options", { exact: true }).selectOption(state);
      for (const name of ["Single value", "Multiple values"]) {
        const control = group.getByRole("combobox", { name, exact: true });
        const list = await openSelectList(page, control);
        await expect(list.locator(".wl-select__empty")).toHaveCSS("font-size", "13px");
        await control.press("Escape");
      }
    }
    const chipsControl = group.getByRole("combobox", { name: "Selected chips" });
    const chipsField = group.locator(".wl-multiselect").filter({ has: page.getByRole("combobox", { name: "Selected chips" }) });
    await expect(chipsField).toHaveCSS("min-height", "34px");
    // With a 17px field override the 1.2.1 height also depends on the theme font.
    const oneChipHeight = (await chipsField.boundingBox())!.height;
    await openSelectList(page, chipsControl);
    await chipsControl.press("End");
    await chipsControl.press("Enter");
    await chipsControl.press("Escape");
    await expect(chipsField.locator(".wl-multiselect__chip")).toHaveCount(2);
    expect((await chipsField.boundingBox())!.height).toBe(oneChipHeight);
  });

  test(`${theme}: selection typography follows the global scale in fields, panels and chips`, async ({ page }) => {
    const fixture = await selectTypographyFixture(page, theme);
    const group = fixture.getByTestId("scaled-selects");
    await page.locator("html").evaluate((root) => {
      root.style.setProperty("--wl-type-control-size", "18px");
      root.style.setProperty("--wl-type-small-size", "14px");
      root.classList.add("wl-type-scale");
    });
    expect.soft(await fontSizes(group.locator('[data-placeholder="true"]')), "placeholders").toEqual(["18px", "18px"]);
    expect.soft(await fontSizes(group.locator(".wl-multiselect__chip-label")), "chip").toEqual(["14px"]);
    for (const name of ["Single value", "Multiple values"]) {
      const control = group.getByRole("combobox", { name, exact: true });
      const list = await openSelectList(page, control);
      const option = list.getByRole("option").first();
      expect.soft(await fontSizes(option), name + " option").toEqual(["18px"]);
      await page.locator("html").evaluate((root) => root.style.setProperty("--wl-type-control-size", "20px"));
      expect.soft(await fontSizes(option), name + " open option after a scale change").toEqual(["20px"]);
      await page.locator("html").evaluate((root) => root.style.setProperty("--wl-type-control-size", "18px"));
      await control.press("Enter");
      await control.press("Escape");
    }
    const selectedLabels = group.locator(".wl-select__label, .wl-multiselect__label").filter({ hasText: "Alpha" });
    expect.soft(await selectedLabels.allTextContents()).toEqual(["Alpha", "Alpha"]);
    expect.soft(await fontSizes(selectedLabels), "selected values").toEqual(["18px", "18px"]);
    await group.evaluate((el) => {
      el.style.setProperty("--wl-select-sm-font-size", "16px");
      el.style.setProperty("--wl-select-lg-font-size", "22px");
    });
    for (const [size, expected] of [["sm", "16px"], ["lg", "22px"]] as const) {
      await fixture.getByLabel("Size", { exact: true }).selectOption(size);
      expect(await fontSizes(selectedLabels)).toEqual([expected, expected]);
    }
    for (const state of ["empty", "loading"]) {
      await fixture.getByLabel("Options", { exact: true }).selectOption(state);
      for (const name of ["Single value", "Multiple values"]) {
        const control = group.getByRole("combobox", { name, exact: true });
        const list = await openSelectList(page, control);
        expect.soft(await fontSizes(list.locator(".wl-select__empty")), name + " " + state).toEqual(["14px"]);
        await control.press("Escape");
      }
    }
  });
}

test("selection typography stays local to the section and its teleported panels", async ({ page }) => {
  const fixture = await selectTypographyFixture(page, "legato");
  await fixture.getByLabel("Local scale").check();
  const group = fixture.getByTestId("scaled-selects");
  expect.soft(await fontSizes(group.locator('[data-placeholder="true"]'))).toEqual(["18px", "18px"]);
  expect.soft(await fontSizes(group.locator(".wl-multiselect__chip-label"))).toEqual(["14px"]);
  for (const [name, expected] of [["Single value", "18px"], ["Multiple values", "18px"], ["Neighbouring select", "13.5px"]] as const) {
    const control = fixture.getByRole("combobox", { name, exact: true });
    const list = await openSelectList(page, control);
    await expect(group.getByRole("listbox")).toHaveCount(0);
    expect.soft(await fontSizes(list.getByRole("option").first()), name).toEqual([expected]);
    await control.press("Escape");
  }
  const autocomplete = fixture.getByRole("combobox", { name: "Neighbouring autocomplete" });
  await page.locator("html").evaluate((root) => {
    root.classList.add("wl-type-scale");
    root.style.setProperty("--wl-type-control-size", "20px");
    root.style.setProperty("--wl-type-small-size", "16px");
  });
  await autocomplete.fill("Alpha");
  const suggestions = page.getByRole("listbox");
  await expect(suggestions).toBeVisible();
  expect(await fontSizes(suggestions.getByRole("option").first())).toEqual(["13.5px"]);
  await fixture.getByLabel("Local scale").uncheck();
  await group.evaluate((el) => {
    el.setAttribute("data-wl-theme", "newspaper");
    el.style.setProperty("--wl-input-font-size", "17px");
  });
  expect(await fontSizes(group.locator('[data-placeholder="true"]'))).toEqual(["17px", "17px"]);
  await fixture.getByLabel("Local scale").check();
  expect(await fontSizes(group.locator('[data-placeholder="true"]'))).toEqual(["18px", "18px"]);

  for (const state of ["empty", "loading"]) {
    await autocomplete.press("Escape");
    await fixture.getByLabel("Options", { exact: true }).selectOption(state);
    await autocomplete.fill(state);
    await expect(suggestions.locator(".wl-select__empty")).toHaveCSS("font-size", "13px");
  }
});

async function chooseLastOption(page: Page, control: Locator) {
  const list = await openSelectList(page, control);
  const option = list.getByRole("option").last();
  const text = await option.innerText();
  const readable = await option.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el.querySelector("span")!);
    const bounds = el.getBoundingClientRect();
    const right = Math.min(bounds.right, document.documentElement.clientWidth);
    return Array.from(range.getClientRects()).every((r) =>
      r.left >= bounds.left - 1 && r.right <= right + 1 && r.top >= bounds.top - 1 && r.bottom <= bounds.bottom + 1);
  });
  expect(readable, "all lines of the open option are visible").toBe(true);
  await control.press("End");
  await control.press("Enter");
  await control.press("Escape");
  return text;
}

async function expectFittedValue(value: Locator, text: string, minOverflow: number) {
  await expect(value).toHaveText(text);
  await expect(value).toHaveCSS("text-overflow", "ellipsis");
  const { fits, overflow } = await value.evaluate((el) => {
    const parent = el.closest(".wl-multiselect__chip, .wl-select, .wl-multiselect")!.getBoundingClientRect();
    const line = el.getBoundingClientRect();
    const fits = line.top >= parent.top - 1 && line.bottom <= parent.bottom + 1
      && line.height + 1 >= parseFloat(getComputedStyle(el).lineHeight);
    return { fits, overflow: el.scrollWidth - el.clientWidth };
  });
  expect(fits, "the full line height fits").toBe(true);
  expect(overflow, "the narrow field exercises truncation").toBeGreaterThanOrEqual(minOverflow);
}

for (const [width, minOverflow] of [[320, 1], [720, 0]] as const) {
  for (const density of ["default", "compact"]) {
    test(`selection typography fits a ${width}px container at ${density} density`, async ({ page }) => {
      const fixture = await selectTypographyFixture(page, "legato");
      const group = fixture.getByTestId("scaled-selects");
      await group.evaluate((el, width) => el.style.width = `${width}px`, width);
      await fixture.getByLabel("Local scale").check();
      await fixture.getByLabel("Density", { exact: true }).selectOption(density);

      const single = group.getByRole("combobox", { name: "Single value" });
      const comma = group.getByRole("combobox", { name: "Multiple values" });
      const chipControl = group.getByRole("combobox", { name: "Selected chips" });
      const commaField = group.locator(".wl-multiselect").filter({ has: page.getByRole("combobox", { name: "Multiple values" }) });
      const chipField = group.locator(".wl-multiselect").filter({ has: page.getByRole("combobox", { name: "Selected chips" }) });

      await expectFittedValue(single.locator(".wl-select__label"), await chooseLastOption(page, single), minOverflow);
      await expectFittedValue(commaField.locator(".wl-multiselect__label"), await chooseLastOption(page, comma), minOverflow);
      const text = await chooseLastOption(page, chipControl);
      const chip = chipField.locator(".wl-multiselect__chip").filter({ hasText: text });
      const label = chip.locator(".wl-multiselect__chip-label");
      await expectFittedValue(label, text, minOverflow);
      const remove = chip.getByRole("button");
      const [labelBox, buttonBox, fieldBox] = await Promise.all([label.boundingBox(), remove.boundingBox(), chipField.boundingBox()]);
      expect(buttonBox!.x).toBeGreaterThanOrEqual(labelBox!.x + labelBox!.width);
      expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(fieldBox!.x + fieldBox!.width);
      await remove.click();
      await expect(chip).toHaveCount(0);
      await expect(chipField.locator(".wl-multiselect__chip-label")).toHaveText("Beta");
    });
  }
}
