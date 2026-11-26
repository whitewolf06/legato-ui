import { chromium, expect } from "@playwright/test";

const base = "http://127.0.0.1:4179";
const browser = await chromium.launch();

async function showPrimaryNavigation(page) {
  const trigger = page.locator(".legato-head-menu-toggle");
  if (await trigger.isVisible() && await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
  return trigger;
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, colorScheme: "light", reducedMotion: "reduce" });
    await page.route("https://mc.yandex.ru/**", (route) => route.abort());
    await page.goto(base);
    const showcase = page.locator("[data-application-showcase]");
    if (await showcase.locator(".project-gallery-card").count()) {
      await expect(showcase.locator("nav a")).toHaveCount(6);
      await expect(showcase.locator("iframe")).toHaveCount(0);
      await showcase.locator('nav a[href*="app=dashboard"]').click();
      const preview = showcase.locator("dialog:modal");
      await expect(preview.getByText("Демонстрация", { exact: true })).toBeVisible();
      await expect(preview.frameLocator("iframe").getByTestId("sales-revenue")).toBeVisible();
      if (viewport.width > 430) {
        await expect(preview.getByRole("radio", { name: "Десктоп", exact: true })).toBeChecked();
        await preview.locator("label").filter({ hasText: "Телефон" }).click();
        await expect(preview.getByRole("radio", { name: "Телефон", exact: true })).toBeChecked();
        await expect(preview.locator("iframe")).toHaveClass(/project-preview-frame--phone/);
        await preview.getByRole("radio", { name: "Телефон", exact: true }).focus();
        await page.keyboard.press("ArrowLeft");
        await expect(preview.getByRole("radio", { name: "Десктоп", exact: true })).toBeChecked();
      }
      await preview.getByRole("button", { name: "Закрыть", exact: true }).click();
      await expect(preview).toHaveCount(0);
    } else if (await showcase.count()) {
      await expect(showcase.locator("nav a")).toHaveCount(5);
      await expect(showcase.locator("iframe")).toHaveCount(0);
      await showcase.getByRole("button", { name: "Запустить пример" }).click();
      await expect(showcase.frameLocator("iframe").getByTestId("sales-revenue")).toBeVisible();
    }
    await showPrimaryNavigation(page);
    const landingFont = page.locator(".legato-head-nav").getByRole("link", { name: "Шрифт", exact: true });
    await expect(landingFont).toHaveAttribute("href", "/ru/font/");
    await expect(page.locator(".hero-intro").getByRole("link", { name: "Legato Sans" })).toHaveAttribute("href", "/ru/font/");
    await expect(page.locator("footer").getByRole("link", { name: "GitHub", exact: true }).locator("svg")).toBeVisible();
    await landingFont.click();
    await expect(page.getByTestId("font-page")).toBeVisible();
    await page.goBack();
    await page.locator("#theme-toggle").click();
    await showPrimaryNavigation(page);
    await page.locator(".legato-head a[data-site-link=catalog]").click();
    await expect(page.locator("#app")).toHaveAttribute("data-v-app", "");
    await expect(page.locator("html")).toHaveAttribute("data-wl-theme", "legato-dark");
    const drawerTrigger = await showPrimaryNavigation(page);
    const compact = await drawerTrigger.isVisible();
    await expect(page.locator(".pg-secondary .pg-menu-trigger")).toHaveCount(0);
    const menu = page.locator(compact ? ".legato-head-extra-links" : ".pg-views");
    await expect(menu.getByRole("link", { name: "GitHub", exact: true }).locator("svg path")).toBeVisible();
    if (compact) await page.keyboard.press("Escape");
    const catalog = page.getByTestId("component-catalog");
    await expect(page.locator("h1")).toHaveText("WlButton");
    const summary = catalog.locator("summary");
    if (await summary.isVisible()) await summary.click();
    await expect(catalog.getByRole("link").first()).toHaveAttribute("aria-current", "page");
    const search = catalog.locator('input[type="search"]');
    await search.fill("WlTable");
    await catalog.getByRole("link", { name: "WlTable", exact: true }).click();
    await expect(page.locator("h1")).toHaveText("WlTable");
    await expect(page).toHaveURL(/\/ru\/docs\/components\/WlTable\//);
    await page.goBack();
    await expect(page.locator("h1")).toHaveText("WlButton");
    await showPrimaryNavigation(page);
    await page.locator(".legato-head [data-site-link=docs]").click();
    await expect(page.locator(".docs-sidebar .docs-catalog-entry")).toHaveAttribute("href", /\/ru\/docs\/components\//);
    await expect(page.locator("#docs-component-catalog")).toHaveCount(0);
    const bounds = await page.locator(".legato-head-inner, .pg-secondary, .docs-layout").evaluateAll((nodes) => nodes.map((node) => {
      const { left, right } = node.getBoundingClientRect();
      return [left, right];
    }));
    expect(bounds).toHaveLength(3);
    expect(bounds[1]).toEqual(bounds[0]);
    expect(bounds[2]).toEqual(bounds[0]);
    await showPrimaryNavigation(page);
    await page.locator(".legato-head [data-site-link=font]").click();
    await expect(page.getByTestId("font-page")).toBeVisible();
    await expect(page.locator(".legato-head [data-site-link=font]")).toHaveAttribute("aria-current", "page");
    await showPrimaryNavigation(page);
    await page.locator(".legato-head a[data-site-link=recipes]").click();
    await expect(page.locator('[data-guide="recipes"]')).toBeVisible();
    const applications = page.getByTestId("application-examples");
    await expect(applications.locator("nav a")).toHaveCount(6);
    await expect(applications.locator("iframe")).toHaveCount(0);
    await applications.locator('nav a[href*="app=mail"]').click();
    const demo = applications.locator("dialog:modal");
    await expect(demo.frameLocator("iframe").getByRole("heading", { name: "Входящие", exact: true })).toBeVisible();
    await demo.getByRole("button", { name: "Закрыть", exact: true }).click();
    await expect(demo).toHaveCount(0);
    await expect(page.locator("#recipe-simple")).toBeVisible();
    await page.locator(".legato-head-brand").click();
    await expect(page).toHaveURL(base + "/");
    await page.getByRole("link", { name: "Быстрый старт", exact: true }).first().click();
    await expect(page.locator("#docs-install")).toBeInViewport();
    await page.close();
  }
} finally {
  await browser.close();
}
