#!/usr/bin/env bash
# Run from the library checkout; the pinned landing checkout is in .tmp/landing.
set -euo pipefail
pnpm build:site
pnpm pages:prerender
node scripts/site/assemble.mjs .tmp/landing apps/playground/dist .tmp/public
python3 scripts/site/verify.py --directory .tmp/public --manifest apps/playground/dist/route-manifest.json --release "$LEGATO_RELEASE_ID"
python3 -m http.server 4179 --bind 127.0.0.1 --directory .tmp/public >"$RUNNER_TEMP/legato-preview.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid"' EXIT
node scripts/site/browser-check.mjs
