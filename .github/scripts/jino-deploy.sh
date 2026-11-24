#!/usr/bin/env bash
set -euo pipefail
[[ "$RELEASE" =~ ^[0-9]+-[0-9]+$ && "$CHECKSUM" =~ ^[a-f0-9]{64}$ ]]
[[ "$JINO_USER" =~ ^[a-zA-Z0-9_]+$ && "$JINO_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
printf '%s  %s\n' "$CHECKSUM" '.tmp/site.tar.gz' | sha256sum --check --status

umask 077
keydir=$(mktemp -d)
trap 'rm -f "$keydir/key" "$keydir/known_hosts"; rmdir "$keydir"' EXIT
printf '%s\n' "$JINO_DEPLOY_KEY" > "$keydir/key"
printf '%s\n' "$JINO_KNOWN_HOSTS" > "$keydir/known_hosts"
unset JINO_DEPLOY_KEY JINO_KNOWN_HOSTS
remote=(ssh -i "$keydir/key" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$keydir/known_hosts" -o ConnectTimeout=20 "$JINO_USER@$JINO_HOST")
"${remote[@]}" "umask 077 && mkdir -p .legato-site/incoming && cat > .legato-site/incoming/$RELEASE.tar.gz" < .tmp/site.tar.gz
# On a lost acknowledgement, the remote marker still identifies exactly what can be rolled back.
if "${remote[@]}" "python3 - activate $RELEASE $CHECKSUM" < scripts/site/switch.py; then
  for delay in 0 3 8; do
    sleep "$delay"
    if python3 scripts/site/verify.py --live --release "$RELEASE"; then exit 0; fi
  done
fi
"${remote[@]}" "python3 - rollback $RELEASE" < scripts/site/switch.py
exit 1
