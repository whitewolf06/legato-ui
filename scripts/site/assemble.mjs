import { copyFileSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { syncLandingHeader } from "./landing.mjs";

const [landingArg, distArg, outputArg] = process.argv.slice(2);
if (!landingArg || !distArg || !outputArg) throw new Error("Usage: assemble.mjs LANDING PLAYGROUND_DIST NEW_OUTPUT");
const [landing, dist, output] = [landingArg, distArg, outputArg].map((path) => resolve(path));
const { LEGATO_LIBRARY_SHA: library, LEGATO_LANDING_SHA: landingSha, LEGATO_RELEASE_ID: release } = process.env;
if (![library, landingSha].every((sha) => /^[0-9a-f]{40}$/.test(sha || "")) || !/^\d+-\d+$/.test(release || "")) throw new Error("Missing pinned source revisions or release ID");
const manifest = JSON.parse(readFileSync(join(dist, "route-manifest.json"), "utf8"));
const report = JSON.parse(readFileSync(join(dist, "prerender-report.json"), "utf8"));
if (manifest.base !== "/" || !manifest.routes.includes("ru/docs/components/") || report.routes.length !== manifest.routes.length) throw new Error("Expected a completed primary prerender");
if (!lstatSync(join(dist, "_playground", release, "assets")).isDirectory()) throw new Error("Missing versioned assets");
mkdirSync(output); // The caller supplies a fresh directory for every release.
const staticExtensions = new Set(".html .css .js .mjs .json .txt .xml .svg .png .jpg .jpeg .webp .ico .woff .woff2 .ttf .zip .wasm".split(" "));
function copyStatic(from, to) {
  if (basename(from).startsWith(".")) throw new Error("Unexpected hidden asset: " + from);
  const stat = lstatSync(from);
  if (stat.isDirectory()) {
    mkdirSync(to);
    for (const name of readdirSync(from)) copyStatic(join(from, name), join(to, name));
  } else if (stat.isFile() && (staticExtensions.has(extname(from).toLowerCase()) || basename(from) === "LICENSE")) {
    copyFileSync(from, to);
  } else throw new Error("Unexpected non-static asset: " + from);
}

for (const name of ["docs", "ru", "system", "font", "theme-builder", "changelog", "_playground", "downloads",
  "legato-social.png", "gavia-social.png", "sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt"]) copyStatic(join(dist, name), join(output, name));
for (const name of ["index.html", "assets", "yandex_4ebe5cdcb9707dc7.html"]) copyStatic(join(landing, name), join(output, name));
await syncLandingHeader(output);
writeFileSync(join(output, "legato-release.json"), JSON.stringify({ release, library, landing: landingSha }) + "\n");
