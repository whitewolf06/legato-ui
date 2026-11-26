"""Check the original HTML response from a release directory or over public HTTPS."""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

PRIMARY = "https://legato-ui.ru/"
VERIFY = "yandex_4ebe5cdcb9707dc7.html"
APPLICATIONS = {"dashboard", "product", "subscription", "knowledge", "newsletter", "booking"}
LEGACY_APPLICATIONS = {"dashboard", "board", "calendar", "orders", "settings"}
SMOKE = ["", "ru/docs/", "docs/", "ru/docs/components/", "docs/components/",
         "ru/docs/components/WlTable/", "docs/components/WlTable/", "ru/docs/recipes/", "docs/why/"]


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = []
        self.meta = {}
        self.anchors = []
        self.text = {"h1": [], "title": []}
        self.capture = None
        self.lang = ""
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "link":
            self.links.append(a)
        elif tag == "meta":
            self.meta[a.get("property") or a.get("name")] = a.get("content")
        elif tag == "a":
            self.anchors.append(a.get("href", ""))
        elif tag == "html":
            self.lang = a.get("lang")
        elif tag in self.text:
            self.capture = tag

    def handle_data(self, value):
        if self.capture:
            self.text[self.capture].append(value)

    def handle_endtag(self, tag):
        if tag == self.capture:
            self.capture = None


def check(read, paths, release=None):
    def require(condition, path, message):
        if not condition:
            raise ValueError("/" + path + " — " + message)

    def check_applications(page, path, lang, expected=APPLICATIONS):
        targets = set()
        for href in page.anchors:
            target = urlsplit(href)
            if target.path == "/examples/" and not target.netloc:
                query = parse_qs(target.query)
                if query.get("lang") == [lang] and query.get("app"):
                    targets.add(query["app"][0])
        require(targets == expected, path, "missing direct links to application examples")

    for path in dict.fromkeys(paths):
        html = read(path)
        page = Page(html)
        alias = "ru/docs/components/" if path == "ru/" else path
        url = urljoin(PRIMARY, alias)
        title = "".join(page.text["title"]).strip()
        require(title and not re.search(r"shell\.seo\.|__LEGATO_|undefined", title), path, "invalid title")
        require("".join(page.text["h1"]).strip() and "<main" in html, path, "missing static content")
        require([link.get("href") for link in page.links if link.get("rel") == "canonical"] == [url], path, "canonical mismatch")
        require(page.meta.get("og:url") == url and page.meta.get("og:image", "").startswith(PRIMARY), path, "invalid Open Graph")
        require(page.meta.get("twitter:image", "").startswith(PRIMARY) and page.meta.get("description"), path, "missing sharing metadata")
        require("noindex" not in (page.meta.get("robots") or "").lower(), path, "primary excluded from indexing")
        lang = "ru" if not path or path.startswith("ru/") else "en"
        require(page.lang == lang, path, "wrong language")
        prefix = "/ru/" if lang == "ru" else "/"
        require(all(prefix + suffix in page.anchors for suffix in ("docs/", "docs/components/", "docs/recipes/", "font/")), path, "missing shared navigation")
        if not path:
            require("ym(114650232" in html and "/ru/docs/#docs-install" in page.anchors, path, "missing Metrika or installation link")
            if "data-project-gallery" in html:
                check_applications(page, path, lang)
            elif "data-application-showcase" in html:
                check_applications(page, path, lang, LEGACY_APPLICATIONS)
            continue
        require("data-playground-prerendered" in html, path, "missing prerender")
        relative = alias[3:] if alias.startswith("ru/") else alias
        translations = {a.get("hreflang"): a.get("href") for a in page.links if a.get("rel") == "alternate"}
        for language in ("en", "ru", "x-default"):
            expected = PRIMARY + ("ru/" if language == "ru" else "") + relative
            require(translations.get(language) == expected, path, "wrong hreflang " + language)
        if relative == "docs/components/":
            require('data-testid="component-catalog"' in html and any(urlsplit(href).path == prefix + "docs/components/WlTable/" for href in page.anchors), path, "missing catalog links")
            selection = "".join(page.text["h1"]).strip()
            require(f'data-docs-component="{selection}"' in html, path, "missing selected component guide")
        elif relative.startswith("docs/components/"):
            require(relative.split("/")[2] in "".join(page.text["h1"]), path, "wrong component")
        elif relative in ("docs/installation/", "docs/why/", "docs/theming/", "docs/recipes/", "docs/accessibility/", "docs/how-it-is-built/"):
            require('data-guide="' + relative.split("/")[1] + '"' in html, path, "missing guide")
            if relative == "docs/recipes/":
                require('id="recipe-simple"' in html and 'id="recipe-applications"' in html, path, "missing recipe groups")
                check_applications(page, path, lang)
    urls = {node.text for node in ET.fromstring(read("sitemap.xml")).findall("{*}url/{*}loc")}
    require(all(url and url.startswith(PRIMARY) for url in urls) and all(PRIMARY + path in urls for path in paths if path != "ru/"), "sitemap.xml", "incorrect canonical URLs")
    example_entry = read("examples/")
    require('id="app-example"' in example_entry and Page(example_entry).meta.get("robots") == "noindex"
            and PRIMARY + "examples/" not in urls, "examples/", "missing interactive entry or incorrect indexing")
    require(".project-preview" in read("project-previews/gallery.css"), "project-previews/gallery.css", "missing gallery style")
    require("Sitemap: " + PRIMARY + "sitemap.xml" in read("robots.txt"), "robots.txt", "missing sitemap")
    require("Verification: 4ebe5cdcb9707dc7" in read(VERIFY), VERIFY, "wrong verification token")
    if release:
        require(json.loads(read("legato-release.json")).get("release") == release, "", "unexpected live release")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--directory", type=Path)
    source.add_argument("--live", action="store_true")
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--release")
    args = parser.parse_args()
    paths = json.loads(args.manifest.read_text())["routes"] if args.manifest else SMOKE
    def read(path):
        if args.directory:
            file = args.directory / path
            return (file / "index.html" if file.is_dir() else file).read_text(encoding="utf-8")
        url = PRIMARY + path
        with urlopen(Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "Legato-Release-Check"}), timeout=20) as response:
            if response.geturl() != url:
                raise ValueError("Unexpected redirect for " + url)
            return response.read().decode("utf-8")
    check(read, paths, args.release)
    print("Verified static HTML, metadata and links for", len(paths), "routes")
