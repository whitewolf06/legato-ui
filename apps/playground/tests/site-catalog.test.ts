import { describe, expect, it } from "vitest";
// @vitest-environment node
import { renderToString } from "vue/server-renderer";
import { gaviaSeoAssets } from "../build/seo-assets";
import { pagesAddress, primaryAddress, siteAddress } from "../build/site-address";
import guideMetadata from "../src/documentation/guide-metadata.json";
import { documentationGuideSections } from "../src/documentation/guides";
import { createPlaygroundPathUrl, parsePlaygroundRoute } from "../src/navigation";
import { renderSiteHeader } from "../src/site/header";

describe("hosted site navigation and metadata", () => {
  it.each(["en", "ru"] as const)("links the %s catalog from both deployment bases", async (locale) => {
    for (const base of ["/", "/legato-ui/"]) {
      const prefix = base + (locale === "ru" ? "ru/" : "");
      const path = prefix + "docs/components/";
      const html = await renderToString(renderSiteHeader(locale, base, "catalog"));
      expect(html).toContain('href="' + path + '" aria-current="page"');
      expect(html).toContain('href="' + prefix + 'docs/recipes/"');
      const route = parsePlaygroundRoute("", "", path);
      expect(route).toEqual({ view: "docs", section: "components" });
      expect(createPlaygroundPathUrl(new URL(path, primaryAddress), route, { base }).pathname).toBe(path);
      expect(parsePlaygroundRoute("", "", path + "WlTable/")).toEqual({ view: "docs", component: "WlTable" });
    }
  });

  it("gives every guide its localized title and description", () => {
    for (const locale of ["en", "ru"] as const) {
      for (const section of documentationGuideSections) {
        expect(guideMetadata[locale][section].title).not.toMatch(/shell\.seo\./);
        expect(guideMetadata[locale][section].description.length).toBeGreaterThan(20);
      }
    }
  });

  it("keeps mirror navigation independent when primary canonical URLs are enabled", () => {
    expect(siteAddress("site")).toBe(primaryAddress);
    expect(siteAddress("pages")).toBe(pagesAddress);
    expect(siteAddress("pages", undefined, true)).toBe(primaryAddress);
    const plugin = gaviaSeoAssets(primaryAddress, "pages", true);
    const transform = plugin.transformIndexHtml;
    if (!transform || typeof transform !== "object") throw new Error("Expected an HTML transform");
    expect(transform.handler.call({} as never, "<!-- site-index-policy -->__LEGATO_PUBLIC_URL__", {} as never))
      .toBe('<meta name="robots" content="noindex,follow">' + primaryAddress);
  });
});
