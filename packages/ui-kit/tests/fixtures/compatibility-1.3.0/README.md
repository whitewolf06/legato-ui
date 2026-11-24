# Published Legato UI 1.3.0 compatibility snapshot

Captured from `legato-ui@1.3.0` published on 2026-11-24. The source inventory comes from tag `v1.3.0`, commit `c5e1825c346a7bca17f419eab3b8d7459a222303`.

| Archive evidence | Value |
| --- | --- |
| npm | [Version metadata](https://registry.npmjs.org/legato-ui/1.3.0) · [Tarball](https://registry.npmjs.org/legato-ui/-/legato-ui-1.3.0.tgz) |
| Registry integrity | `sha512-Wb2UBI/G7iV4Q4JVcXI8ITiSOcg3/e00JffoVt5z2YGeVp3SI9yEwVdTIL9LCyY08Kn5lqHzCaceFa1cc6UwQw==` |
| Archive SHA-256 | `21b8c576f474a2f00124d16b1e7c76dac5e3d58c5da087af775908bfb16278ad` |
| Archive size and contents | 1,225,321 bytes, 203 files, including 147 declaration files |
| Public inventory | 60 components, 255 named exports in the root declarations, 581 tokens, 7 themes |

The downloaded npm archive matched the SHA-512 recorded by the release job. Its 17 stylesheets, 10 JavaScript bundles, token catalog and component manifest matched the tagged build. Each frozen declaration matched the normalized SHA-256 of its counterpart in the npm archive. [Release job](https://github.com/whitewolf06/legato-ui/actions/runs/45313092781/job/138180013473) · [Contract inventory](contract.json)

The Vue consumer covers both forms of `WlCalendar.disabledDates`. The ESM consumer imports `parseWlThemeConfig` and `createWlTheme` from `legato-ui/theme`, generates a delta theme and checks its branded selector and radius override. [Vue consumer](consumer.vue) · [Theme consumer](consumer.mjs)
