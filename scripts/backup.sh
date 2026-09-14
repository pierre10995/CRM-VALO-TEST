#!/usr/bin/env bash
# Sauvegarde logique de la base (format custom pg_dump, compressé).
#
# Usage :
#   DATABASE_URL=postgresql://... npm run backup
#   ou  DATABASE_URL=... BACKUP_DIR=/chemin scripts/backup.sh
#
# Restauration :
#   pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" backups/crm-YYYY-MM-DD_HHMM.dump
#
# À automatiser (cron Railway, GitHub Actions ou machine locale) avec envoi
# vers un stockage chiffré (S3/R2/Backblaze). Conserver ≥ 30 jours.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL est requis}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y-%m-%d_%H%M)"
OUT="$BACKUP_DIR/crm-$STAMP.dump"

mkdir -p "$BACKUP_DIR"
echo "→ Sauvegarde vers $OUT"
pg_dump --format=custom --no-owner --no-privileges --file="$OUT" "$DATABASE_URL"
echo "✓ $(du -h "$OUT" | cut -f1) écrit"

# Rotation locale
find "$BACKUP_DIR" -name 'crm-*.dump' -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
echo "✓ Rotation : sauvegardes de plus de $RETENTION_DAYS jours supprimées"
