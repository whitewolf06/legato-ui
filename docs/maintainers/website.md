# Legato website releases

The landing lives in its own repository. The library owns the shared header, bilingual documentation, component catalog, Pages mirror and the production workflow. A push to either main branch can publish the combined site. The release records both Git commit IDs in `/legato-release.json`.

## Addresses

| Destination | Russian | English |
| --- | --- | --- |
| Guides and installation | `/ru/docs/#docs-install` | `/docs/#docs-install` |
| Component catalog | `/ru/docs/components/` | `/docs/components/` |
| Live recipes | `/ru/docs/recipes/` | `/docs/recipes/` |

The primary site serves the Russian landing at `/`. The Pages root under `/legato-ui/` opens its local catalog. The portable Playground keeps its original home and query navigation. Hosted builds prerender localized HTML with Vite and Chromium.

## Local development

With both checkouts side by side, run `pnpm dev:site` in the library. The Vite server serves the HTML landing at its root and the Vue pages at their public paths. Set `LEGATO_LANDING_DIR` to use a different landing checkout. To refresh the standalone landing header after editing the library, run `node scripts/site/landing.mjs ../legato-ui-site` with Node 24.

A landing pull request builds the complete static site in the private repository. It uses the library branch of the same name when one exists, otherwise library `main`, and records both resolved commit IDs. It runs the same prerender, static HTML checks and browser interactions as production. Its Actions summary records the route count, archive size and SHA-256 digest. Set the landing repository variable `LEGATO_REVIEW_ARTIFACTS=true` to retain a downloadable archive when Actions storage is available.

## Connect GitHub and Jino

1. Publish the landing checkout to its own GitHub repository with a `main` branch. In the **library repository** set the Actions variable `LEGATO_LANDING_REPO` to its full `owner/name`. For a private landing repository, supply a read-only Contents token as the library Actions secret `LEGATO_LANDING_READ_TOKEN`.
2. In the **landing repository**, set `LEGATO_DISPATCH_TOKEN` to a fine-grained token with Actions write access to the library repository. Its main-branch workflow requests the central release and passes the exact landing commit.
3. In the **library repository**, configure the `jino-production` environment for `main`. Set its variables `JINO_HOST` and `JINO_USER`, and its secrets `JINO_DEPLOY_KEY` and `JINO_KNOWN_HOSTS`. Use a deployment-specific SSH key. Install its public half in the hosting account. The known-hosts secret contains the complete OpenSSH host key line for that hostname, verified against Jino's published fingerprint.
4. The SSH account needs Python 3, write access to `~/domains/legato-ui.ru` and its parent, and a Linux filesystem shared with `~/.legato-site` that supports exchanging directories with `renameat2`. The domain root must be a real directory. The server receives a verified static archive. Its release operation unpacks files and switches directories.
5. The workflow **Legato website** runs after successful main-push CI and can also be run from the Actions tab on `main`. It resolves both current main commits, restores quality results from that library CI run, builds and prerenders, checks every static route and exercises the assembled site on desktop and mobile. It rechecks both revisions before deployment.
6. After the production workflow passes its public HTTPS checks and you accept the primary site, set the library variable `LEGATO_PAGES_NOINDEX=true`. The next Pages build emits `noindex,follow` and primary canonical links. Mirror builds and navigation continue to work during a Jino outage.

## Rollback

The transfer finishes outside the web root. Publication atomically exchanges the staged directory with the existing domain directory. The old site is retained at `~/.legato-site/versions/<release>`, including the pre-CD landing on the first release. The host's `.envrc`, `.htaccess`, `.well-known` and `.user.ini` are carried into the new directory when present. The preceding release's versioned chunks remain available to open browser sessions.

If public HTTPS checks fail, the workflow switches back and fails the deployment. For a later manual rollback, read the current release ID from `/legato-release.json` and run the following from the library checkout with the deployment account. The script checks that the expected release is still live before switching.

```sh
ssh "$JINO_USER@$JINO_HOST" "python3 - rollback $RELEASE" < scripts/site/switch.py
```

Backups are kept outside the public directory. Their names identify the release that displaced them. Review disk use before removing old backups. A new run gets a fresh release ID. The GitHub **Legato website** run transfers the verified archive directly from its runner and records the checksum and verification logs.
