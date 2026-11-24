import type { Plugin } from "vite";
import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const types: Record<string, string> = {
  ".css": "text/css", ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml"
};
const files = new Set(["/index.html", "/robots.txt", "/sitemap.xml", "/yandex_4ebe5cdcb9707dc7.html"]);

/** In combined development only, serve the sibling landing alongside Vite's documentation routes. */
export function landingPreview(directory: string): Plugin {
  return {
    name: "legato-landing-preview",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url || "/", "http://localhost").pathname;
        const entry = pathname === "/" ? "/index.html" : pathname;
        if (!files.has(entry) && !entry.startsWith("/assets/")) return next();
        try {
          const root = await realpath(directory);
          const file = await realpath(resolve(root, "." + decodeURIComponent(entry)));
          if (!file.startsWith(root + sep) || (!files.has(entry) && !file.startsWith(resolve(root, "assets") + sep))) {
            res.writeHead(404).end();
            return;
          }
          const buffer = await readFile(file);
          res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
          res.end(req.method === "HEAD" ? undefined : buffer);
        } catch {
          res.writeHead(404).end();
        }
      });
    }
  };
}
