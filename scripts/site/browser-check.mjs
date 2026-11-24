import { chromium, expect } from "@playwright/test";

const base = "http://127.0.0.1:4179";
const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, colorScheme: "light", reducedMotion: "reduce" });
    await page.route("https://mc.yandex.ru/**", (route) => route.abort());
    await page.goto(base);
    await page.locator("#theme-toggle").click();
    await page.locator(".legato-head a[data-site-link=catalog]").click();
    await expect(page.locator("html")).toHaveAttribute("data-wl-theme", "legato-dark");
    const catalog = page.getByTestId("component-catalog");
    await expect(catalog.getByRole("link").first()).toBeVisible();
    const search = catalog.locator('input[type="search"]');
    await search.fill("WlTable");
    const card = catalog.getByRole("link").filter({ has: page.getByText("WlTable", { exact: true }) });
    await card.click();
    await expect(page.locator("h1")).toHaveText("WlTable");
    await expect(page).toHaveURL(/\/ru\/docs\/components\/WlTable\//);
    await page.goBack();
    await expect(catalog).toBeVisible();
    await page.locator(".legato-head a[data-site-link=recipes]").click();
    await expect(page.locator('[data-guide="recipes"]')).toBeVisible();
    await page.locator(".legato-head-brand").click();
    await expect(page).toHaveURL(base + "/");
    await page.getByRole("link", { name: "Быстрый старт", exact: true }).first().click();
    await expect(page.locator("#docs-install")).toBeInViewport();
    await page.close();
  }
} finally {
  await browser.close();
}
