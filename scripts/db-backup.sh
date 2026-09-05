#!/usr/bin/env bash
#
# Dump a database to a timestamped file under backups/.
#
#   pnpm db:backup                    # whatever DATABASE_URL points at
#   pnpm db:backup "postgres://..."   # an explicit URL, e.g. production
#
# Restore with:
#   psql "$TARGET_URL" -f backups/<file>.sql
#
# pg_dump rather than a hand-rolled JSON export: it gets column types, foreign
# key ordering and defaults right, and restores with psql alone. A dump that
# only *mostly* restores is worse than no dump, because you find out during an
# incident.
set -euo pipefail

URL="${1:-}"
if [ -z "$URL" ]; then
  if [ ! -f .env ]; then
    echo "No URL given and no .env to read DATABASE_URL from." >&2
    exit 1
  fi
  URL="$(grep '^DATABASE_URL' .env | head -1 | cut -d= -f2- | tr -d '"'"'"'')"
fi

if [ -z "$URL" ]; then
  echo "DATABASE_URL is empty." >&2
  exit 1
fi

# Host only - never print the password, these logs get pasted into chats.
HOST="$(printf '%s' "$URL" | sed -E 's|.*@([^/?]+).*|\1|')"
SHORT="$(printf '%s' "$HOST" | cut -d. -f1)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backups/${SHORT}-${STAMP}.sql"

mkdir -p backups

echo "Dumping ${HOST}"
echo "     -> ${OUT}"

# --no-owner/--no-acl so the dump restores into any role, which is what you
# want when moving production data into a fresh dev branch.
pg_dump "$URL" --no-owner --no-acl --format=plain --file="$OUT"

SIZE="$(du -h "$OUT" | cut -f1)"
ROWS="$(grep -c '^INSERT INTO\|^COPY ' "$OUT" || true)"
echo "Done: ${SIZE}, ${ROWS} data statements"
echo
echo "Restore into a target with:"
echo "  psql \"\$TARGET_URL\" -f ${OUT}"
