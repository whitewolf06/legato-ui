# Published Gavia UI 1.1.0 compatibility snapshot

Captured on 2026-11-22 from the published `gavia-ui@1.1.0` archive. The source
inventory comes from tag `v1.1.0`, commit
`8de5b7acf5a262770d7dbdf82f3a0378451ed1c9`.

| Archive evidence | Value |
| --- | --- |
| npm | [Version metadata](https://registry.npmjs.org/gavia-ui/1.1.0) · [Tarball](https://registry.npmjs.org/gavia-ui/-/gavia-ui-1.1.0.tgz) |
| Registry integrity | `sha512-E+7tl7U2djb+D3D8MGLa+fiKGdUwLyj4ZxDK+9PagTmLAaOz/3YqgylMpdpiUC3sXVr976opQO85/Mxzd+JyJA==` |
| Archive SHA-256 | `fb6b7f15fac70c3338d9ae3d74246b1569260b9006288c8be1f0ff12e883d72f` |
| Archive size and contents | 1,201,432 bytes, 191 files, including 144 declaration files |
| Public inventory | 60 components, 255 named declaration exports, 533 tokens, 5 themes |

The archive matched the registry's SHA-512 and SHA-1 before extraction. Its
package exports, 14 stylesheets and design-token catalog matched the tagged
source. The capture used the archive's `dist/` directly and recorded the SHA-256
of each declaration after line-ending normalization. [Contract inventory](contract.json)

The frozen consumer extends the 1.0.0 consumer with two uses of
`WlCalendar.disabledDates`. One passes a readonly tuple of ISO dates. The other
uses the inferred ISO string in a predicate. Both compiled against the published
`gavia-ui` entry point. Removing the prop in a test copy produced TS2353 at both
bindings. Restricting it to either form produced TS2322 at the other binding.
[Consumer test](consumer.vue)
