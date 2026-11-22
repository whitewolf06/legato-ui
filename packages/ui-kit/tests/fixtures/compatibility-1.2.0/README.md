# Published Legato UI 1.2.0 compatibility snapshot

Captured on 2026-11-22 from the published `legato-ui@1.2.0` archive. The source
inventory comes from tag `v1.2.0`, commit `53845a238b8a013d624d0822e9fda96cb77d72eb`.

| Archive evidence | Value |
| --- | --- |
| npm | [Version metadata](https://registry.npmjs.org/legato-ui/1.2.0) · [Tarball](https://registry.npmjs.org/legato-ui/-/legato-ui-1.2.0.tgz) |
| Registry integrity | `sha512-0id71hcg9QnTfdmLatZYgomE9Qf7bfC/9hD/etNUXYwjNqCMakWnz2n7UHhOGWVcLTOpfGIYJS/motyvhZm7pw==` |
| Archive SHA-256 | `f1ab4fd40f308cf807882b37b1b99dc51d814ea08fbec1a3f7230c288e1de023` |
| Archive size and contents | 1,217,125 bytes, 203 files, including 147 declaration files |
| Public inventory | 60 components, 255 named exports in the root declarations, 533 tokens, 7 themes |

The downloaded archive matched the registry's SHA-512 and SHA-1 before
extraction. Its exports, CLI paths, 17 stylesheets and design-token catalog
matched the tagged source. All 147 declarations were captured from the archive
and checked against their normalized SHA-256 digests. [Contract inventory](contract.json)

The Vue consumer imports the renamed package, displays the generated theme CSS
and retains both 1.1.0 `WlCalendar.disabledDates` cases. [Vue consumer](consumer.vue)

The ESM consumer imports `parseWlThemeConfig` and `createWlTheme` from
`legato-ui/theme`, parses an unknown input and generates a delta theme. It
checks the branded selector and the consumer's radius override. The compatibility
check type-checks this file and then executes it in Node. [Theme consumer](consumer.mjs)

In isolated copies of the archive, narrowing either function's input produced
TS2345 at its call site. Removing `./theme` produced TS2307 in TypeScript and
`ERR_PACKAGE_PATH_NOT_EXPORTED` in Node. Returning empty CSS with the published
declarations still in place failed the runtime assertion.
