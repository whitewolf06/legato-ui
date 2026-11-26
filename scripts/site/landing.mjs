import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSiteHeader } from "../../apps/playground/src/site/header.ts";

const { renderToString } = createRequire(new URL("../../apps/playground/package.json", import.meta.url))("vue/server-renderer");
const source = new URL("../../apps/playground/src/", import.meta.url);
const start = "<!-- legato-header:start -->";
const end = "<!-- legato-header:end -->";

/** Refresh the standalone landing's static copy of the shared navigation. */
export async function syncLandingHeader(directory) {
  const file = resolve(directory, "index.html");
  const html = readFileSync(file, "utf8");
  const before = html.split(start);
  const after = before[1]?.split(end);
  if (before.length !== 2 || after?.length !== 2) throw new Error("Missing or repeated landing header markers");
  writeFileSync(file, before[0] + start + "\n" + await renderToString(renderSiteHeader("ru", "/")) + "\n" + end + after[1]);
  const css = readFileSync(new URL("site/header.css", source), "utf8");
  writeFileSync(resolve(directory, "assets/site-header.css"), css.replace("../assets/brand/duetto/legato-wordmark.svg?no-inline", "./brand/legato-wordmark.svg"));
  copyFileSync(new URL("assets/brand/duetto/legato-wordmark.svg", source), resolve(directory, "assets/brand/legato-wordmark.svg"));
  if (html.includes("data-project-gallery")) {
    const previews = new URL("../../apps/playground/public/project-previews/", import.meta.url);
    const target = resolve(directory, "assets/project-previews");
    mkdirSync(target, { recursive: true });
    for (const asset of readdirSync(previews).filter((name) => /^(?:gallery\.css|[a-z-]+\.webp)$/.test(name))) {
      copyFileSync(new URL(asset, previews), resolve(target, asset));
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error("Pass the landing checkout directory");
  await syncLandingHeader(resolve(process.argv[2]));
}
