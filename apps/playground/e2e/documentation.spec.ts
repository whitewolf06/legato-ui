import { expect, type Locator, type Page, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { wlManifest } from "../../../packages/ui-kit/src/manifest";
import { playgroundBasePath, playgroundRouteParams, russianPlaygroundUrl } from "./playground-url";
import { publishedName } from "./project-version";
import { chooseDropdownOption, copyCodePanel, navigateMainView, openDocumentationMenu } from "./select-helpers";

const defaultStand = "http://127.0.0.1:4173/";
const pageErrors = new WeakMap<Page, string[]>();

function pageUrl(baseURL: string | undefined, query = ""): string {
  const url = new URL(baseURL ?? defaultStand);
  url.search = query;
  url.hash = "";
  return url.href;
}

async function expectRoute(
  page: Page, baseURL: string | undefined, view: string | null,
  component: string | null = null, section: string | null = null
): Promise<void> {
  await expect.poll(() => {
    const url = new URL(page.url());
    return { path: playgroundBasePath(url), view: playgroundRouteParams(url).get("view"), component: playgroundRouteParams(url).get("component"), section: playgroundRouteParams(url).get("section") };
  }).toEqual({ path: new URL(baseURL ?? defaultStand).pathname, view, component, section });
}

async function expectNoHorizontalOverflow(page: Page, element: Locator): Promise<void> {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  )).toBeLessThanOrEqual(1);
  await expect.poll(() => element.evaluate((node) =>
    node.scrollWidth - node.clientWidth
  )).toBeLessThanOrEqual(1);
}

async function enterCompactDocumentation(page: Page): Promise<void> {
  const menu = page.getByTestId("docs-page").locator(".docs-menu");
  const summary = menu.locator(".docs-menu-summary");
  const wasCompact = await summary.isVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(summary).toBeVisible();
  // Only desktop-to-compact transitions reset details.open through Vue's matchMedia listener.
  if (!wasCompact) await expect(menu).toHaveJSProperty("open", false);
}

const buttonExampleLinks = [
  "Вариант и тон", "Размер и плотность", "Загрузка и блокировка",
  "Положение иконки", "Кнопка в форме", "Когда использовать"
] as const;

function documentationOutline(docs: Locator): Locator {
  return docs.locator(".docs-on-page nav");
}

async function expectSinglePageOutline(docs: Locator): Promise<void> {
  const outline = documentationOutline(docs);
  await expect(outline).toBeVisible();
  await expect(docs.locator('.docs-sidebar a[href^="#"]')).toHaveCount(0);
  await expect.poll(() => outline.getByRole("link").evaluateAll((links: HTMLAnchorElement[]) => {
    const targets = [...document.querySelectorAll("[id]")];
    return links.length > 0 && links.every((link) => targets.filter((target) => target.id === link.hash.slice(1)).length === 1);
  }), "Outline links target unique content IDs").toBe(true);
}

async function expectComponentOutline(workspace: Locator, labels: readonly string[]): Promise<void> {
  const outline = workspace.getByRole("navigation", { name: "На этой странице", exact: true });
  await expect(outline).toBeVisible();
  await expect(outline.getByRole("link")).toHaveText([...labels]);
  await expect(outline.locator("[aria-current]")).toHaveCount(0);
  await expect.poll(() => workspace.evaluate((root) => {
    const tabs = root.querySelector('[role="tablist"]');
    const links = root.querySelector(".docs-component-outline");
    const panel = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'))
      .find((element) => element.getClientRects().length > 0);
    return !!tabs && !!links && !!panel && tabs.nextElementSibling === links
      && Boolean(links.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING);
  }), "Section links follow the tabs and precede the visible panel").toBe(true);
  await expect.poll(() => outline.getByRole("link").evaluateAll((links: HTMLAnchorElement[]) =>
    links.every((link) => {
      const heading = document.getElementById(link.hash.slice(1));
      return heading?.tagName === "H2" && heading.getClientRects().length > 0
        && heading.textContent?.trim() === link.textContent?.trim()
        && getComputedStyle(link).backgroundColor === "rgba(0, 0, 0, 0)";
    })
  ), "Every plain anchor targets an actual heading in the selected tab").toBe(true);
}

async function expectButtonOutline(workspace: Locator, labels: readonly string[]): Promise<void> {
  const desktop = workspace.page().locator(".docs-on-page nav");
  const compact = workspace.locator(".button-compact-outline");
  const wide = await workspace.page().evaluate(() => matchMedia("(min-width: 1201px)").matches);
  await expect(wide ? desktop : compact).toBeVisible();
  if (!wide && !(await compact.evaluate((details: HTMLDetailsElement) => details.open))) {
    await compact.locator("summary").click();
  }
  const links = (wide ? desktop : compact).getByRole("link");
  await expect(links).toHaveText([...labels]);
  await expect.poll(() => links.evaluateAll((items: HTMLAnchorElement[]) =>
    items.every((item) => {
      const target = document.getElementById(item.hash.slice(1));
      return target?.tagName === "H2" && !!target.getClientRects().length && target.textContent === item.textContent;
    })
  )).toBe(true);
}

async function buttonFillRatio(button: Locator): Promise<number> {
  return button.evaluate((element) => {
    if (!element.parentElement) throw new Error("Live button must have a layout container");
    return element.getBoundingClientRect().width / element.parentElement.getBoundingClientRect().width;
  });
}

function buttonWorkspace(page: Page): Locator {
  return page.getByTestId("docs-page").locator('[data-docs-component="WlButton"]');
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), "Home and documentation must load without runtime errors").toEqual([]);
});

test("home opens WlButton documentation and controls update the live button, consumer code and API", async ({ page, baseURL }, testInfo) => {
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL)), { waitUntil: "domcontentloaded" });
  const home = page.getByTestId("home-page");
  await expect(home.getByRole("heading", { level: 1 })).toHaveText("Legato UI");
  await expect(home.getByTestId("home-install")).toHaveText(`pnpm add ${publishedName}`);
  await expectRoute(page, baseURL, null);
  // Reveal below-fold decoration before checking the complete-page capture.
  for (const image of await home.locator('img[loading="lazy"]').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
      element.complete && element.naturalWidth > 0
    )).toBe(true);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => home.locator("img").evaluateAll((images: HTMLImageElement[]) =>
    images.every((image) => image.complete && image.naturalWidth > 0)
  )).toBe(true);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const homeScreenshot = await page.screenshot({ fullPage: true });
  await home.getByRole("link", { name: "Читать документацию", exact: true }).click();
  const docs = page.getByTestId("docs-page");
  await expect(docs).toBeVisible();
  await openDocumentationMenu(page);
  const sidebar = docs.locator(".docs-sidebar");
  const catalog = sidebar.getByRole("navigation", { name: "Каталог компонентов", exact: true, includeHidden: true });
  await expect(sidebar.getByRole("heading", { name: "Начало работы", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Введение", exact: true })).toHaveCount(0);
  const overviewNavigation = sidebar.getByRole("navigation", { name: "Разделы начала работы", exact: true, includeHidden: true });
  await expect(overviewNavigation.getByRole("link", { includeHidden: true })).toHaveText(["Установка"]);
  const majorHeadings = sidebar.locator("h2.docs-sidebar-heading");
  await expect(majorHeadings).toHaveText(["Начало работы", "Основы", "Оформление"]);
  await expect(majorHeadings.locator("svg[aria-hidden='true']")).toHaveCount(3);
  await expect.poll(() => majorHeadings.locator("svg").evaluateAll((icons) =>
    icons.map((icon) => icon.getAttribute("data-icon"))
  )).toEqual(["book", "grid", "image"]);
  await expect(catalog).toHaveCount(0);
  await expect(sidebar.getByRole("searchbox")).toHaveCount(0);
  const catalogEntry = sidebar.getByRole("link", { name: "Компоненты", exact: true });
  await expect(catalogEntry).toHaveCount(1);
  await catalogEntry.click();
  await expectRoute(page, baseURL, "docs", null, "components");
  await expect(buttonWorkspace(page)).toBeVisible();
  await openDocumentationMenu(page);
  await expect(catalog.getByRole("link").first()).toHaveAttribute("aria-current", "page");
  await expect.poll(() => catalog.getByRole("link").first().evaluate((button) => {
    const style = getComputedStyle(button);
    return Number.parseFloat(style.minHeight) === (matchMedia("(pointer: coarse)").matches ? 36 : 30)
      && Number.parseFloat(style.paddingTop) === 6 && Number.parseFloat(style.paddingBottom) === 6;
  }), "Only component rows use the compact 30px/36px touch target").toBe(true);
  await expect(sidebar.locator("#docs-component-search")).toBeVisible();
  await expect(sidebar.locator("#docs-component-search")).toHaveAttribute("type", "search");
  await expect(sidebar.getByText(/Найдено:/)).toHaveCount(0);
  await expect(catalog.getByRole("link")).toHaveCount(wlManifest.length);
  await expect(catalog.getByRole("heading", { level: 3 })).toHaveText([
    "Действия", "Ввод данных", "Данные", "Контейнеры", "Составные элементы", "Навигация", "Обратная связь", "Дополнительно"
  ]);
  await catalog.getByRole("link", { name: "WlButton", exact: true }).click();
  await expect(catalog.getByRole("navigation")).toHaveCount(0);
  await expect(sidebar.getByRole("navigation", { name: "На этой странице", exact: true })).toHaveCount(0);
  await expect(overviewNavigation).toHaveCount(0);
  await expect(catalog.getByRole("link", { name: "WlButton", exact: true, includeHidden: true })).toHaveAttribute("aria-current", "page");
  await expect.poll(() => catalog.getByRole("heading", { name: "Ввод данных", exact: true, includeHidden: true }).evaluate((heading) => {
    const link = heading.parentElement?.querySelector("a");
    if (!link) return false;
    const headingStyle = getComputedStyle(heading);
    return Number.parseFloat(headingStyle.fontSize) > Number.parseFloat(getComputedStyle(link).fontSize)
      && headingStyle.color === getComputedStyle(heading.closest(".docs-page")!).color;
  }), "Category headings are larger and use the page text color").toBe(true);
  const workspace = buttonWorkspace(page);
  await expect(workspace).toBeVisible();
  await expect(workspace.getByRole("tablist", { name: "Разделы WlButton", exact: true })).toHaveCSS("border-bottom-width", "0px");
  await expectButtonOutline(workspace, buttonExampleLinks);
  const rulesButton = docs.getByRole("button", { name: "Правила дизайн-системы", exact: true });
  await expect(rulesButton).toHaveAttribute("data-variant", "secondary");
  await expectRoute(page, baseURL, "docs", "WlButton");
  const topic = (name: string) => workspace.locator('[data-docs-button-example="' + name + '"]');
  const variants = topic("variants");
  const sizes = topic("sizes");
  const states = topic("states");
  const form = topic("form");
  const preview = page.getByTestId("docs-button-preview");
  const button = preview.getByRole("button", { name: "Добавить", exact: true });
  const source = page.getByTestId("docs-button-source");
  const snippet = source.locator("pre code");
  const sizedButton = sizes.locator(".button-sample-stage button");
  const stateButton = states.locator(".button-sample-stage button");
  const formButton = form.locator(".button-sample-stage button");
  const block = form.getByRole("checkbox", { name: "block", exact: true });

  await expect(button).toHaveAttribute("data-variant", "primary");
  await expect(snippet).not.toContainText("tone=");
  await chooseDropdownOption(page, variants.getByRole("combobox", { name: "variant", exact: true }), "soft");
  await chooseDropdownOption(page, variants.getByRole("combobox", { name: "tone", exact: true }), "danger");
  await expect(snippet).toContainText('variant="soft" tone="danger"');
  await expect(button).toHaveAttribute("data-tone", "danger");
  await button.click();
  await expect(preview.getByRole("status")).toHaveText("Нажатий: 1");

  await chooseDropdownOption(page, sizes.getByRole("combobox", { name: "size", exact: true }), "lg");
  await chooseDropdownOption(page, sizes.getByRole("combobox", { name: "density", exact: true }), "compact");
  await expect(sizedButton).toHaveAttribute("data-size", "lg");
  await expect(sizedButton).toHaveAttribute("data-density", "compact");
  await expect(sizes.locator(".button-sample pre code")).toContainText('size="lg" density="compact"');
  await expect(button).toHaveAttribute("data-size", "md");

  const disabled = states.getByRole("checkbox", { name: "disabled", exact: true });
  await disabled.check();
  await expect(stateButton).toBeDisabled();
  await expect(states.locator(".button-sample pre code")).toContainText(" disabled");
  await disabled.uncheck();
  const loading = states.getByRole("checkbox", { name: "loading", exact: true });
  await loading.check();
  await expect(stateButton).toBeDisabled();
  await expect(stateButton).toHaveAttribute("aria-busy", "true");
  await expect(states.locator(".button-sample pre code")).toContainText(" loading");
  await expect(button).toBeEnabled();
  await loading.uncheck();
  await expect(stateButton).toBeEnabled();
  const icons = topic("slots");
  await chooseDropdownOption(page, icons.getByRole("combobox", { name: "iconPosition", exact: true }), "end");
  await expect(icons.locator(".button-sample-stage button > :last-child")).toHaveAttribute("data-icon", "arrow-right");
  await expect(icons.locator(".button-sample pre code")).toContainText('icon-position="end"');
  await expect(block).not.toBeChecked();
  await expect.poll(() => buttonFillRatio(formButton)).toBeLessThan(0.9);
  await block.check();
  await expect.poll(() => buttonFillRatio(formButton)).toBeCloseTo(1, 2);
  await formButton.click();
  await expect(form.locator(".button-sample-stage [role=status]")).toHaveText("Отправок: 1");
  await chooseDropdownOption(page, form.getByRole("combobox", { name: "type", exact: true }), "reset");
  await formButton.click();
  await expect(form.locator(".button-sample-stage [role=status]")).toHaveText("Отправок: 0");

  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (value: string) => { document.documentElement.dataset.docsCopied = value; } }
  }));
  await copyCodePanel(source);
  await expect(source.getByRole("status")).toHaveText("Код скопирован.");
  await expect(page.locator("html")).toHaveAttribute("data-docs-copied", (await snippet.textContent())!);
  await source.locator("summary").click();
  await expect(snippet).toContainText('from "legato-ui"');
  await expect(snippet).toContainText('variant="soft" tone="danger"');
  await expect(snippet).not.toContainText("usePlaygroundI18n");
  await copyCodePanel(source);
  await expect(page.locator("html")).toHaveAttribute("data-docs-copied", (await snippet.textContent())!);

  const apiTab = workspace.getByRole("tab", { name: "API", exact: true });
  await apiTab.click();
  await expect(apiTab).toHaveAttribute("aria-selected", "true");
  await expectButtonOutline(workspace, ["Props", "События", "Слоты", "Pass-through: pt"]);
  const props = workspace.getByRole("region", { name: "Props WlButton", exact: true });
  await expect(props).toBeVisible();
  for (const name of ["variant", "size", "density", "disabled", "loading", "block", "type", "pt"]) {
    await expect(props.getByRole("rowheader", { name, exact: true }), name + " public prop").toHaveCount(1);
  }
  await apiTab.focus();
  await apiTab.press("ArrowRight");
  const accessibilityTab = workspace.getByRole("tab", { name: "Доступность", exact: true });
  await expect(accessibilityTab).toBeFocused();
  await expect(accessibilityTab).toHaveAttribute("aria-selected", "true");
  await expectButtonOutline(workspace, ["Клавиатура и состояния"]);
  await expect(workspace.getByRole("heading", { name: "Клавиатура и состояния", exact: true })).toBeVisible();
  await accessibilityTab.press("Home");
  const examplesTab = workspace.getByRole("tab", { name: "Примеры", exact: true });
  await expect(examplesTab).toBeFocused();
  await expect(examplesTab).toHaveAttribute("aria-selected", "true");
  await expectButtonOutline(workspace, buttonExampleLinks);
  await expect(button).toHaveAttribute("data-variant", "soft");
  await variants.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(button).toHaveAttribute("data-variant", "primary");
  await expect(snippet).not.toContainText("tone=");
  await expect(preview.getByRole("status")).toHaveText("Нажатий: 0");
  await expect(sizedButton).toHaveAttribute("data-size", "lg");
  await expect(block).toBeChecked();
  await expectNoHorizontalOverflow(page, docs);
  const homeScreenshotPath = testInfo.outputPath("home-desktop.png");
  await writeFile(homeScreenshotPath, homeScreenshot);
  await testInfo.attach("home-desktop", { path: homeScreenshotPath, contentType: "image/png" });
  await page.screenshot({ path: testInfo.outputPath("docs-button-desktop.png"), fullPage: true });
});

test("direct WlButton documentation survives reload, Back and Forward beneath the current base path", { tag: "@cross-browser" }, async ({ page, baseURL }) => {
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs&component=WlButton")), { waitUntil: "domcontentloaded" });
  await expect(buttonWorkspace(page)).toBeVisible();
  await expectRoute(page, baseURL, "docs", "WlButton");
  await page.reload();
  await expect(buttonWorkspace(page)).toBeVisible();
  await expectRoute(page, baseURL, "docs", "WlButton");
  await navigateMainView(page, "Главная");
  await expect(page.getByTestId("home-page")).toBeVisible();
  await expectRoute(page, baseURL, null);
  await page.goBack();
  await expect(buttonWorkspace(page)).toBeVisible();
  await expectRoute(page, baseURL, "docs", "WlButton");
  await page.goForward();
  await expect(page.getByTestId("home-page")).toBeVisible();
  await expectRoute(page, baseURL, null);
  await page.getByTestId("home-page").getByRole("link", { name: "Документация WlButton", exact: true }).click();
  await expect(buttonWorkspace(page)).toBeVisible();
  await expectRoute(page, baseURL, "docs", "WlButton");

  const installationUrl = new URL(pageUrl(baseURL, "?view=docs"));
  installationUrl.hash = "docs-install";
  await page.goto(russianPlaygroundUrl(installationUrl.href), { waitUntil: "domcontentloaded" });
  const installationHeading = page.getByTestId("docs-page").locator("h2#docs-install");
  await expect(installationHeading).toBeInViewport();
  await expectRoute(page, baseURL, "docs");
  expect(new URL(page.url()).hash).toBe("#docs-install");
  await page.reload();
  await expect(installationHeading).toBeInViewport();
  await expectRoute(page, baseURL, "docs");
  expect(new URL(page.url()).hash).toBe("#docs-install");

  const quickstartUrl = new URL(pageUrl(baseURL));
  quickstartUrl.hash = "home-quickstart";
  await page.goto(russianPlaygroundUrl(quickstartUrl.href), { waitUntil: "domcontentloaded" });
  const quickstartHeading = page.getByTestId("home-page").locator("#home-quickstart").getByRole("heading", { level: 2 });
  await expect(quickstartHeading).toBeInViewport();
  await expectRoute(page, baseURL, null);
  expect(new URL(page.url()).hash).toBe("#home-quickstart");
  await page.reload();
  await expect(quickstartHeading).toBeInViewport();
  await expectRoute(page, baseURL, null);
  expect(new URL(page.url()).hash).toBe("#home-quickstart");
});

async function expectNativeInstallationLink(page: Page, installation: Locator, baseURL: string | undefined): Promise<void> {
  const original = page.url();
  await installation.focus();
  await expect(installation).toBeFocused();
  // Exercise the native foreground-tab keyboard shortcut without a mouse click.
  const [newTab] = await Promise.all([
    page.context().waitForEvent("page"),
    installation.press("ControlOrMeta+Shift+Enter")
  ]);
  try {
    await newTab.waitForLoadState("domcontentloaded");
    await expect(newTab.getByTestId("docs-page")).toBeVisible();
    await expect(newTab.locator('[data-guide="installation"]')).toBeVisible();
    await expectRoute(newTab, baseURL, "docs", null, "installation");
    expect(page.url()).toBe(original);
    await expect(page.locator('[data-guide="why"]')).toBeVisible();
  } finally {
    await newTab.close();
  }
  await page.bringToFront();
}

function expectFoundationSource(consumerCode: string | null, name: string): void {
  if (name === "text-hierarchy") {
    expect(consumerCode).toContain("wl-text-heading");
    expect(consumerCode).toMatch(/<h[34]\b/);
  } else if ([
    "typography-scale", "responsive-grid", "gap-alignment", "page-composition",
    "spacing", "stacking-layers", "content-writing", "content-states"
  ].includes(name)) {
    expect(consumerCode).toContain('from "legato-ui"');
  } else {
    expect(consumerCode).toContain("<template>");
    expect(consumerCode).toContain("wl-");
  }
}

async function expectLayoutFoundation(page: Page, foundation: Locator, toc: Locator, section: string): Promise<void> {
  if (section !== "layout") return;
  await toc.getByRole("link", { name: "Слои и z-index", exact: true }).click();
  await expect(foundation.locator("#docs-layout-layers")).toBeInViewport();
  expect(new URL(page.url()).hash).toBe("#docs-layout-layers");
  await expect(foundation.getByRole("region", { name: "Уровни z-index Legato UI", exact: true }).getByRole("row")).toHaveCount(10);
  const grid = foundation.locator('[data-docs-example="responsive-grid"]').getByTestId("docs-foundation-preview");
  await grid.getByRole("button", { name: "Выбрать Проектирование", exact: true }).click();
  await expect(grid.getByRole("status")).toHaveText("Выбрано: Проектирование");
  await grid.getByRole("button", { name: "Сбросить выбор", exact: true }).click();
  await expect(grid.getByRole("status")).toHaveText("Выберите карточку. Действия переносятся на следующую строку.");
}

async function revealDocumentationCode(source: Locator): Promise<void> {
  if (!await source.locator("details").evaluate((details: HTMLDetailsElement) => details.open)) {
    await source.locator(".ds-source-frame summary").click();
  }
}

async function scrollToDocumentationHeading(page: Page, nextHeading: Locator, headerBottom: number): Promise<void> {
  for (let step = 0; step < 8; step++) {
    const nextTop = await nextHeading.evaluate((heading) => heading.getBoundingClientRect().top);
    const remaining = nextTop - headerBottom + 24;
    if (remaining <= 1) break;
    const distance = Math.min(400, remaining);
    const beforeStep = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, distance);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(Math.floor(beforeStep + distance) - 1);
  }
}

async function expectDesktopStickySidebar(page: Page, docs: Locator, mobile: boolean): Promise<void> {
  if (mobile) return;
  // Long examples let the sidebar stick without reaching the end of its grid container.
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await expect.poll(() => docs.locator(".docs-sidebar").evaluate((sidebar) => {
    const globalHeader = document.querySelector<HTMLElement>(".pg-top")!;
    return Math.abs(sidebar.getBoundingClientRect().top - globalHeader.getBoundingClientRect().bottom - 16);
  }), "The desktop sidebar remains just below the global header while scrolling").toBeLessThanOrEqual(1);
}

test("native keyboard documentation links open a foreground tab and preserve the original page", { tag: "@cross-browser" }, async ({ page, baseURL }) => {
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs&section=why")), { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-guide="why"]')).toBeVisible();
  const docs = await openDocumentationMenu(page);
  const installation = docs.getByRole("navigation", { name: "Разделы начала работы", exact: true })
    .getByRole("link", { name: "Установка", exact: true });
  await expectNativeInstallationLink(page, installation, baseURL);
});

test("the Installation entry stays in place across Docs pages and is usable in the mobile menu", async ({ page, baseURL }) => {
  const docs = page.getByTestId("docs-page");
  const start = docs.getByRole("navigation", { name: "Разделы начала работы", exact: true, includeHidden: true });
  const installation = start.getByRole("link", { name: "Установка", exact: true, includeHidden: true });
  const visits = [
    { section: null, width: 1280 },
    { section: "how-it-is-built", width: 1280 },
    { section: "icons", width: 320 }
  ] as const;
  for (const { section, width } of visits) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(russianPlaygroundUrl(pageUrl(baseURL, section ? "?view=docs&section=" + section : "?view=docs")), { waitUntil: "domcontentloaded" });
    await expectRoute(page, baseURL, "docs", null, section);
    await openDocumentationMenu(page);
    await expect(start.getByRole("link")).toHaveText(["Установка"]);
    await expect(start.locator("[aria-current]")).toHaveCount(0);
    await page.evaluate(() => {
      document.documentElement.dataset.installationSpa = "retained";
    });
    const sourceUrl = page.url();
    const menuHeight = (await start.boundingBox())!.height;
    const historyLength = await page.evaluate(() => history.length);
    await installation.click();
    await expectRoute(page, baseURL, "docs", null, "installation");
    await expect(installation).toHaveAttribute("aria-current", "page");
    await expect(page.locator("html")).toHaveAttribute("data-installation-spa", "retained");
    expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
    await expectSinglePageOutline(docs);
    await expect(documentationOutline(docs).getByRole("link")).toHaveText([
      "Что понадобится", "Установка пакета", "Стили и тема", "Первый компонент", "Подписи на русском"
    ]);
    await expect(docs.locator(".docs-menu")).toHaveJSProperty("open", width !== 320);
    await expectNoHorizontalOverflow(page, docs);
    await openDocumentationMenu(page);
    expect((await start.boundingBox())!.height).toBeCloseTo(menuHeight);
    await page.goBack();
    await expect.poll(() => page.url()).toBe(sourceUrl);
    await expect(start.locator("[aria-current]")).toHaveCount(0);
    await page.goForward();
    await expectRoute(page, baseURL, "docs", null, "installation");
    await expect(installation).toHaveAttribute("aria-current", "page");
  }
});

test("overview anchors keep the same page and do not add duplicate history entries", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs")), { waitUntil: "domcontentloaded" });
  const docs = page.getByTestId("docs-page");
  const outline = documentationOutline(docs);
  await outline.getByRole("link", { name: "Миграция", exact: true }).click();
  await expect(docs.locator("#docs-migration")).toBeInViewport();
  const currentHistoryLength = await page.evaluate(() => history.length);
  await outline.getByRole("link", { name: "Миграция", exact: true }).click();
  expect(await page.evaluate(() => history.length)).toBe(currentHistoryLength);
  await outline.getByRole("link", { name: "Установка", exact: true }).click();
  await expect(docs.locator("#docs-install")).toBeInViewport();
  await page.goBack();
  await expect(docs.locator("#docs-migration")).toBeInViewport();
  await page.goForward();
  await expect(docs.locator("#docs-install")).toBeInViewport();
  await expectRoute(page, baseURL, "docs");
});

test("history restores Docs anchors after an interrupted smooth overview transition", { tag: "@cross-browser" }, async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const initial = new URL(pageUrl(baseURL, "?view=docs&section=responsive"));
  initial.hash = "docs-responsive-breakpoints";
  await page.goto(russianPlaygroundUrl(initial.href), { waitUntil: "domcontentloaded" });
  const docs = page.getByTestId("docs-page");
  const source = docs.locator("#docs-responsive-breakpoints");
  await expect(source).toBeInViewport();
  await docs.getByTestId("playground-page-header").getByRole("link", { name: "Документация", exact: true }).click();
  await expectRoute(page, baseURL, "docs");
  await documentationOutline(docs).getByRole("link", { name: "Миграция", exact: true }).click();
  // Traverse before the long smooth scroll to the overview's final section completes.
  await expect.poll(() => new URL(page.url()).hash).toBe("#docs-migration");
  await page.goBack();
  expect(new URL(page.url()).hash).toBe("");
  await page.goBack();
  await expectRoute(page, baseURL, "docs", null, "responsive");
  await expect(source).toBeInViewport();
  await page.goForward();
  await expectRoute(page, baseURL, "docs");
  await page.goForward();
  expect(new URL(page.url()).hash).toBe("#docs-migration");
  await expect.poll(() => page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const target = document.getElementById("docs-migration");
    const header = document.querySelector(".pg-top");
    if (!target || !header) return false;
    const bounds = target.getBoundingClientRect();
    return bounds.top >= header.getBoundingClientRect().bottom - 1 && bounds.bottom <= innerHeight;
  }), "History anchor stays visible below the sticky header after native restoration").toBe(true);
});

test("home and interactive WlButton documentation remain usable at 320px", async ({ page, baseURL }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL)), { waitUntil: "domcontentloaded" });
  const home = page.getByTestId("home-page");
  await expect(home.getByRole("heading", { level: 1 })).toHaveText("Legato UI");
  await expectNoHorizontalOverflow(page, home);
  await home.getByRole("link", { name: "Документация WlButton", exact: true }).click();
  const docs = page.getByTestId("docs-page");
  const workspace = buttonWorkspace(page);
  await expect(workspace).toBeVisible();
  await expectRoute(page, baseURL, "docs", "WlButton");
  await expectNoHorizontalOverflow(page, docs);
  for (const name of ["variant", "size", "density", "type"]) {
    const control = workspace.getByTestId("docs-control-" + name);
    const bounds = await control.boundingBox();
    expect(bounds, name + " control has geometry").not.toBeNull();
    expect(bounds!.x, name + " left edge").toBeGreaterThanOrEqual(-1);
    expect(bounds!.x + bounds!.width, name + " right edge").toBeLessThanOrEqual(321);
  }
  await chooseDropdownOption(page, workspace.getByRole("combobox", { name: "variant", exact: true }), "ghost");
  await chooseDropdownOption(page, workspace.getByRole("combobox", { name: "size", exact: true }), "sm");
  const preview = page.getByTestId("docs-button-preview");
  const button = preview.getByRole("button", { name: "Добавить", exact: true });
  await expect(button).toHaveAttribute("data-variant", "ghost");
  await expect(button).toHaveAttribute("data-size", "md");
  await expect(workspace.locator('[data-docs-button-example="sizes"] .button-sample-stage button')).toHaveAttribute("data-size", "sm");
  await button.click();
  await expect(preview.getByRole("status")).toHaveText("Нажатий: 1");
  await expectNoHorizontalOverflow(page, preview);
  await expect(page.getByTestId("docs-button-source").locator("pre code")).toContainText('variant="ghost"');
  await workspace.getByRole("tab", { name: "API", exact: true }).click();
  await expect(workspace.getByRole("region", { name: "Props WlButton", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page, docs);
  await workspace.getByRole("tab", { name: "Примеры", exact: true }).click();
  await expect(page.getByTestId("docs-button-source").locator("pre code")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("docs-button-mobile-320.png"), fullPage: true });
});

test("foundations navigation keeps representative examples, copy and 320px layout usable", async ({ page, baseURL }) => {
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs&theme=gavia")), { waitUntil: "domcontentloaded" });
  const docs = page.getByTestId("docs-page");
  const navigation = docs.getByRole("navigation", { name: "Основы", exact: true });
  const foundation = docs.getByTestId("docs-foundation-page");
  const sections = [
    { name: "typography", label: "Типографика", sample: "text-hierarchy", examples: ["typography-scale", "text-hierarchy"] },
    { name: "layout", label: "Layout и сетка", sample: "responsive-grid", examples: ["containers", "equal-columns", "column-proportions", "responsive-grid", "gap-alignment", "nested-grid", "page-composition", "spacing", "css-helpers", "stacking-layers"] },
    { name: "content", label: "Контент и состояния", sample: "content-states", examples: ["content-writing", "content-states"] }
  ];
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (value: string) => { document.documentElement.dataset.docsCopied = value; } }
  }));
  for (const section of sections) {
    await openDocumentationMenu(page);
    await navigation.getByRole("button", { name: section.label, exact: true }).click();
    await expect(foundation).toHaveAttribute("data-docs-section", section.name);
    await expect(docs.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(docs.getByRole("heading", { level: 1 })).toHaveText(section.label);
    await expectRoute(page, baseURL, "docs", null, section.name);
    await expect(foundation.locator("[data-docs-example]")).toHaveCount(section.examples.length);
    const toc = documentationOutline(docs);
    await expectSinglePageOutline(docs);
    await expect(toc.getByRole("link")).toHaveCount(section.examples.length + (section.name === "layout" ? 4 : 2));
    await expect.poll(() => toc.getByRole("link").evaluateAll((links: HTMLAnchorElement[]) => links.every((link) => {
      const heading = document.getElementById(link.hash.slice(1));
      return heading?.tagName === "H2" && heading.textContent?.trim() === link.textContent?.trim();
    })), "TOC labels and anchors match actual H2 headings").toBe(true);
    // The unit contract compiles every foundation SFC; exercise real copy once per section.
    const name = section.sample;
    const example = foundation.locator('[data-docs-example="' + name + '"]');
    await expect(example.getByTestId("docs-foundation-preview").locator(":scope > :first-child")).toBeVisible();
    const panel = example.getByTestId("docs-foundation-source");
    const code = panel.locator("pre code");
    await expect(code).toBeVisible();
    const consumerCode = await code.textContent();
    expect(consumerCode, name + " source is available").not.toBeNull();
    expectFoundationSource(consumerCode, name);
    expect(consumerCode).not.toContain("packages/ui-kit");
    expect((await code.locator(".ds-code-token").allTextContents()).join(""), name + " highlighted source is unchanged").toBe(consumerCode);
    await copyCodePanel(panel);
    await expect(panel.getByRole("status")).toHaveText("Код скопирован.");
    await expect(page.locator("html")).toHaveAttribute("data-docs-copied", consumerCode!);
    await expectLayoutFoundation(page, foundation, toc, section.name);
  }

  const content = foundation.locator('[data-docs-example="content-states"]');
  const preview = content.getByTestId("docs-foundation-preview");
  const states = preview.getByRole("group", { name: "Состояние примера контента", exact: true });
  await states.getByRole("button", { name: "Загрузка", exact: true }).click();
  await expect(states.getByRole("button", { name: "Загрузка", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(preview.getByRole("status")).toHaveAttribute("aria-busy", "true");
  await expect(preview.getByRole("status")).toContainText("Загружаем материалы…");
  await states.getByRole("button", { name: "Пусто", exact: true }).click();
  await expect(preview.getByText("Материалов пока нет", { exact: true })).toBeVisible();
  await preview.getByRole("button", { name: "Добавить пример", exact: true }).click();
  await expect(preview.getByRole("status")).toHaveText("Доступно материалов: 3");
  await states.getByRole("button", { name: "Ошибка", exact: true }).click();
  await expect(preview.getByRole("alert")).toContainText("Не удалось загрузить материалы");
  await preview.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(states.getByRole("button", { name: "Готово", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(preview.getByRole("status")).toHaveText("Доступно материалов: 3");

  const code = content.getByTestId("docs-foundation-source").locator("pre code");
  const sourceText = await code.textContent();
  await expect(code).toHaveText(sourceText!);
  const colors = await code.locator(".ds-code-token").evaluateAll((tokens) =>
    [...new Set(tokens.filter((token) => token.textContent?.trim()).map((token) => getComputedStyle(token).color))]
  );
  expect(colors.length, "Gavia syntax uses more than one computed color").toBeGreaterThan(1);

  await enterCompactDocumentation(page);
  for (const section of sections) {
    await openDocumentationMenu(page);
    await navigation.getByRole("button", { name: section.label, exact: true }).click();
    await expect(foundation).toHaveAttribute("data-docs-section", section.name);
    await expectRoute(page, baseURL, "docs", null, section.name);
    await expectNoHorizontalOverflow(page, docs);
    await expectNoHorizontalOverflow(page, foundation);
    for (const name of section.examples) {
      await expectNoHorizontalOverflow(page, foundation.locator('[data-docs-example="' + name + '"]').getByTestId("docs-foundation-preview"));
    }
  }
  await expectSinglePageOutline(docs);
  await documentationOutline(docs).getByRole("link", { name: "Готово, загрузка, пусто и ошибка", exact: true }).click();
  await expect(foundation.locator("#docs-content-states")).toBeInViewport();
  expect(new URL(page.url()).hash).toBe("#docs-content-states");
  await page.reload();
  await expect(foundation.locator("#docs-content-states")).toBeInViewport();
  await expectRoute(page, baseURL, "docs", null, "content");
  await expectNoHorizontalOverflow(page, docs);
});

test("documentation scrollspy follows real Layout and icon scrolling without rewriting anchor history", { tag: "@cross-browser" }, async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs")), { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "html { scroll-behavior: auto; }" });
  const docs = page.getByTestId("docs-page");
  const content = docs.locator(".docs-content");
  const routes = [
    { section: "layout", group: "Основы", label: "Layout и сетка", anchor: "docs-layout-containers", next: "docs-layout-equal-columns" },
    { section: "icons", group: "Оформление", label: "Иконки", anchor: "docs-icons-catalog", next: "docs-icons-accessibility" }
  ];

  for (const route of routes) {
    await openDocumentationMenu(page);
    await docs.getByRole("navigation", { name: route.group, exact: true }).getByRole("button", { name: route.label, exact: true }).click();
    await expectRoute(page, baseURL, "docs", null, route.section);
    const toc = documentationOutline(docs);
    await expectSinglePageOutline(docs);
    const anchor = toc.locator('a[href="#' + route.anchor + '"]');
    await anchor.click();
    await expect(content.locator("#" + route.anchor)).toBeInViewport();
    await expect(anchor).toHaveAttribute("aria-current", "location");
    await expect(toc.locator('[aria-current="location"]')).toHaveCount(1);
    const anchoredUrl = page.url();
    expect(new URL(anchoredUrl).hash).toBe("#" + route.anchor);

    // Wheel over the page padding, outside the independently scrollable TOC/code.
    // The distance reaches the next real heading, regardless of the live example's height.
    const bounds = await content.boundingBox();
    const header = await page.locator(".pg-top").boundingBox();
    expect(bounds).not.toBeNull();
    expect(header).not.toBeNull();
    const headerBottom = header!.y + header!.height;
    await page.mouse.move(bounds!.x - 8, headerBottom + 120);
    const nextHeading = content.locator("#" + route.next);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    // Firefox caps one large wheel event at roughly a viewport. Use normal wheel steps.
    await scrollToDocumentationHeading(page, nextHeading, headerBottom);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
    const next = toc.locator('a[href="#' + route.next + '"]');
    await expect(next).toHaveAttribute("aria-current", "location");
    await expect(anchor).not.toHaveAttribute("aria-current", "location");
    await expect(toc.locator('[aria-current="location"]')).toHaveCount(1);
    expect(page.url(), "Scrollspy updates the current section, preserving the clicked anchor URL").toBe(anchoredUrl);
  }
});

test("component examples keep controls above their preview and code, with independent state at 320px", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs&component=WlInput")), { waitUntil: "domcontentloaded" });
  const docs = page.getByTestId("docs-page");
  const workspace = docs.locator('[data-docs-component="WlInput"]');
  const tabs = workspace.getByRole("tablist", { name: "Руководство WlInput", exact: true });
  await expect(tabs).toBeVisible();
  await expect(tabs).toHaveCSS("border-bottom-width", "0px");
  await expectRoute(page, baseURL, "docs", "WlInput");
  const explorer = workspace.getByTestId("ds-explorer");
  const controls = explorer.locator(".docs-example-controls");
  const size = explorer.getByRole("combobox", { name: "Пример: size", exact: true });
  const density = explorer.getByRole("combobox", { name: "Пример: density", exact: true });
  const preview = explorer.getByTestId("ds-example-preview");
  const input = preview.getByRole("textbox", { name: "Название материала", exact: true });
  const inputRoot = preview.locator('[data-wl="input"]');
  const source = explorer.locator(".ds-source");
  const states = workspace.locator('[data-docs-example="example-states"]');
  const statesInput = states.locator(".docs-example-stage").getByRole("textbox", { name: "Название материала", exact: true });
  const statesSource = states.locator(".ds-source");
  const invalid = states.getByRole("checkbox", { name: "invalid", exact: true });
  const disabled = states.getByRole("checkbox", { name: "disabled", exact: true });

  const expectVerticalLayout = () => expect.poll(async () => {
    const [settingsBounds, previewBounds, sourceBounds] = await Promise.all([
      controls.boundingBox(), preview.boundingBox(), source.boundingBox()
    ]);
    if (!settingsBounds || !previewBounds || !sourceBounds) return false;
    return settingsBounds.y + settingsBounds.height <= previewBounds.y + 1
      && Math.abs(previewBounds.x - sourceBounds.x) <= 1
      && sourceBounds.y >= previewBounds.y + previewBounds.height - 1;
  }, "Controls, preview, and code share the card at the current width").toBe(true);
  await expectVerticalLayout();

  const exampleHeadings = ["Размер и плотность", "Состояния", "Содержимое", "Размеры, слоты и проверка"];
  const outline = docs.locator(".docs-component-outline");
  await expectComponentOutline(workspace, exampleHeadings);
  await outline.getByRole("link", { name: "Состояния", exact: true }).click();
  expect(new URL(page.url()).hash).toBe("#docs-wlinput-example-states");
  await expect(outline.locator("[aria-current]")).toHaveCount(0);

  await input.fill("Задача документации");
  await chooseDropdownOption(page, size, "lg");
  await chooseDropdownOption(page, density, "compact");
  await invalid.check();
  await disabled.check();
  await expect(input).toHaveValue("Задача документации");
  await expect(input).toBeEnabled();
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await expect(inputRoot).toHaveAttribute("data-size", "lg");
  await expect(inputRoot).toHaveAttribute("data-density", "compact");
  await expect(statesInput).toHaveValue("Материал команды");
  await expect(statesInput).toBeDisabled();
  await expect(statesInput).toHaveAttribute("aria-invalid", "true");
  await revealDocumentationCode(source);
  await revealDocumentationCode(statesSource);
  const code = source.locator("details pre code");
  const statesCode = statesSource.locator("details pre code");
  await expect(code).toBeVisible();
  await expect(code).toContainText('from "legato-ui"');
  await expect(code).toContainText('"size":"lg"');
  await expect(code).toContainText('"density":"compact"');
  await expect(code).not.toContainText('"invalid":true');
  await expect(statesCode).toContainText('"invalid":true');
  await expect(statesCode).toContainText('"disabled":true');

  await tabs.getByRole("tab", { name: "API", exact: true }).click();
  await expect(workspace.getByRole("region", { name: "Props WlInput", exact: true })).toBeVisible();
  await expectComponentOutline(workspace, ["Props", "События", "Слоты", "Pass-through: pt"]);
  await expect(preview).toBeHidden();
  await tabs.getByRole("tab", { name: "Доступность", exact: true }).click();
  await expectComponentOutline(workspace, ["Клавиатура и доступность"]);
  await tabs.getByRole("tab", { name: "Примеры", exact: true }).click();
  await expect(preview).toBeVisible();
  await expectComponentOutline(workspace, exampleHeadings);
  await expect(input).toHaveValue("Задача документации");
  await expect(size).toContainText("lg");
  await expect(density).toContainText("compact");
  await expect(statesInput).toBeDisabled();

  await explorer.getByRole("button", { name: "Сбросить пример", exact: true }).click();
  await expect(input).toHaveValue("Материал команды");
  await expect(inputRoot).toHaveAttribute("data-size", "md");
  await expect(code).not.toContainText('"size":"lg"');
  await expect(statesInput).toBeDisabled();
  await states.getByRole("button", { name: "Сбросить пример", exact: true }).click();
  await expect(statesInput).toBeEnabled();
  await expect(invalid).not.toBeChecked();

  const extra = workspace.locator('[data-docs-component-extra="WlInput"]');
  await expect(extra.getByTestId("docs-component-extra-preview").getByRole("textbox", { name: "Название, sm", exact: true })).toHaveValue("План команды");
  await expect(extra.getByTestId("docs-component-extra-source").locator("pre code")).toContainText('from "legato-ui"');

  await page.setViewportSize({ width: 320, height: 740 });
  await expectVerticalLayout();
  for (const surface of [docs, workspace, explorer, controls, preview, source, states, extra]) {
    await expectNoHorizontalOverflow(page, surface);
  }
  await chooseDropdownOption(page, size, "sm");
  await expect(inputRoot).toHaveAttribute("data-size", "sm");
  await expect(code).toContainText('"size":"sm"');
});

test("a modal example preserves both documentation outlines and the position of the examples", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs&component=WlDialog")), { waitUntil: "domcontentloaded" });
  const docs = page.getByTestId("docs-page");
  const inline = docs.locator(".docs-component-outline a");
  const sidebar = docs.locator(".docs-on-page nav a");
  const heading = docs.locator("#docs-wldialog-preview");
  const opener = docs.getByRole("button", { name: "Редактировать название", exact: true });
  await expect(inline).toHaveCount(3);
  await expect(sidebar).toHaveCount(3);
  await opener.scrollIntoViewIfNeeded();
  const initial = await heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);

  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Редактирование материала", exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.locator("#app")).toHaveAttribute("inert", "");
  await expect(inline).toHaveCount(3);
  await expect(sidebar).toHaveCount(3);
  expect(Math.abs(await heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY) - initial))
    .toBeLessThanOrEqual(1);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(inline).toHaveCount(3);
  await expect(sidebar).toHaveCount(3);
  expect(Math.abs(await heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY) - initial))
    .toBeLessThanOrEqual(1);
});

test("documentation tabs keep header spacing stable and preserve sidebar placement on desktop and mobile", async ({ page, baseURL }, testInfo) => {
  const measurements: Array<Record<string, string | number>> = [];
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const mobile = viewport.width <= 760;
    for (const component of ["WlTimePicker", "WlButton"]) {
      await page.goto(russianPlaygroundUrl(pageUrl(baseURL, "?view=docs&component=" + component)), { waitUntil: "domcontentloaded" });
      const docs = page.getByTestId("docs-page");
      const workspace = docs.locator('[data-docs-component="' + component + '"]');
      const tabs = workspace.getByRole("tablist", { name: component === "WlButton" ? "Разделы WlButton" : "Руководство " + component, exact: true });
      await expect(workspace).toBeVisible();
      await expect(tabs).toBeVisible();
      await expectRoute(page, baseURL, "docs", component);
      await page.evaluate(() => document.fonts.ready);
      const route = page.url();
      const measureSpacing = () => docs.evaluate((root) => {
        const layout = root.querySelector<HTMLElement>(".docs-layout")!;
        const header = root.querySelector<HTMLElement>(".docs-page-header")!.getBoundingClientRect();
        const sidebarElement = root.querySelector<HTMLElement>(".docs-sidebar")!;
        const sidebar = sidebarElement.getBoundingClientRect();
        const content = root.querySelector<HTMLElement>(".docs-content")!.getBoundingClientRect();
        const tablist = root.querySelector<HTMLElement>('[data-testid="docs-component-tabs"]')!.getBoundingClientRect();
        return {
          rowGap: Number.parseFloat(getComputedStyle(layout).rowGap),
          headerToContent: content.top - header.bottom,
          headerToSidebar: sidebar.top - header.bottom,
          sidebarToContent: content.top - sidebar.bottom,
          sidebarToHeaderTop: sidebar.top - header.top,
          tabsToContent: tablist.top - content.top,
          sidebarPosition: getComputedStyle(sidebarElement).position,
          menuOpen: root.querySelector<HTMLDetailsElement>(".docs-menu")!.open
        };
      });

      // Both a generic guide and the dedicated Button guide must survive long/short tab changes.
      for (const name of ["Примеры", "API", "Доступность", "Примеры"]) {
        await test.step(viewport.width + "px " + component + " " + name, async () => {
          const tab = tabs.getByRole("tab", { name, exact: true });
          await tab.click();
          await expect(tab).toHaveAttribute("aria-selected", "true");
          await expect(tabs.locator('[aria-selected="true"]')).toHaveCount(1);
          const panelId = await tab.getAttribute("aria-controls");
          expect(panelId).toBeTruthy();
          await expect(workspace.locator('[id="' + panelId + '"]')).toBeVisible();
          await expect(workspace.getByRole("tabpanel")).toHaveCount(1);
          await expect(docs.getByRole("heading", { level: 1 })).toHaveText(component);
          expect(page.url(), "Local tabs preserve the component route").toBe(route);
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await expect.poll(async () => {
            const spacing = await measureSpacing();
            // Mobile navigation occupies its own row between the introduction and tabs.
            const gapErrors = mobile
              ? [spacing.headerToSidebar - spacing.rowGap, spacing.sidebarToContent - spacing.rowGap]
              : [spacing.headerToContent - spacing.rowGap, spacing.sidebarToHeaderTop];
            return Math.max(...gapErrors.map(Math.abs), Math.abs(spacing.tabsToContent));
          }, "Tabs follow the introduction with normal grid spacing, including the short accessibility panel").toBeLessThanOrEqual(1);
          const spacing = await measureSpacing();
          expect(spacing.rowGap).toBeGreaterThan(0);
          expect(spacing.sidebarPosition).toBe(mobile ? "static" : "sticky");
          expect(spacing.menuOpen).toBe(!mobile);
          measurements.push({ width: viewport.width, component, tab: name, ...spacing, menuOpen: String(spacing.menuOpen) });
          await expectNoHorizontalOverflow(page, docs);
          await expectNoHorizontalOverflow(page, workspace);
        });
      }

      await expectDesktopStickySidebar(page, docs, mobile);
    }
  }
  const path = testInfo.outputPath("docs-tab-header-spacing.json");
  await writeFile(path, JSON.stringify(measurements, null, 2));
  await testInfo.attach("docs-tab-header-spacing", { path, contentType: "application/json" });
});
