import { expect, test } from "@playwright/test";

test("Tab enters the selected tab after the tabs change order", { tag: "@cross-browser" }, async ({ page }) => {
  await page.goto("/e2e.html?review-tabs-order");
  const fixture = page.getByRole("region", { name: "Tab order" });
  const tabs = fixture.getByRole("tab");
  const beta = fixture.getByRole("tab", { name: "Beta" });
  const reverse = fixture.getByRole("button", { name: "Reverse tabs" });
  await expect(tabs).toHaveText(["Alpha", "Beta"]);
  await beta.click();
  await expect(beta).toHaveAttribute("aria-selected", "true");

  await reverse.press("Enter");
  await expect(tabs).toHaveText(["Beta", "Alpha"]);
  await expect(reverse).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(beta).toBeFocused();
  await expect(beta).toHaveAttribute("aria-selected", "true");
});

// Authored contracts, not automatically accepted snapshots. Run and review with
// the separately authorized production browser matrix before release.
test("list and tab accessibility trees retain names and selection", { tag: "@cross-browser" }, async ({ page, baseURL }) => {
  const url = new URL(baseURL ?? "http://127.0.0.1:4173/");
  url.search = new URLSearchParams({ view: "docs", component: "WlSelect", lang: "en", theme: "gavia" }).toString();
  await page.goto(url.href);
  const preview = page.getByTestId("ds-example-preview").first();
  const control = preview.getByRole("combobox", { name: "Scope", exact: true });
  await control.press("ArrowDown");
  await expect(page.getByRole("listbox", { name: "Scope", exact: true })).toMatchAriaSnapshot(`
    - listbox "Scope":
      - group "Scope":
        - option "Team" [selected]
        - option "Personal"
        - option "Research" [disabled]
  `);
  await control.press("Escape");
  url.searchParams.set("component", "WlTabs");
  await page.goto(url.href);
  const tabs = page.getByTestId("ds-example-preview").first().getByRole("tablist");
  await expect(tabs).toMatchAriaSnapshot(`
    - tablist:
      - tab "Overview" [selected]
      - tab "History 3"
  `);
  await tabs.getByRole("tab", { name: "Overview", exact: true }).press("ArrowRight");
  await expect(tabs).toMatchAriaSnapshot(`
    - tablist:
      - tab "Overview"
      - tab "History 3" [selected]
  `);
});
