#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── Couleurs ────────────────────────────────────────────────────────
green()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
red()    { printf '\033[0;31m%s\033[0m\n' "$*"; }

# ── 1. Fichier .env ────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  green "✔ .env créé à partir de .env.example"
  yellow "  → Modifie-le si besoin avant de continuer."
else
  green "✔ .env déjà présent"
fi

# ── 2. Dépendances npm ─────────────────────────────────────────────
if [ ! -d node_modules ]; then
  yellow "⏳ Installation des dépendances…"
  npm install
  green "✔ Dépendances installées"
else
  green "✔ node_modules déjà présent"
fi

# ── 3. PostgreSQL ───────────────────────────────────────────────────
start_postgres_docker() {
  yellow "⏳ Démarrage de PostgreSQL via Docker Compose…"
  docker compose up -d db
  echo -n "  Attente de PostgreSQL"
  for i in $(seq 1 15); do
    if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
      echo ""
      green "✔ PostgreSQL prêt (Docker)"
      return 0
    fi
    echo -n "."
    sleep 1
  done
  echo ""
  red "✗ PostgreSQL n'a pas démarré dans les temps"
  return 1
}

start_postgres_local() {
  yellow "⏳ Démarrage de PostgreSQL local…"
  if command -v pg_isready > /dev/null 2>&1 && pg_isready -q 2>/dev/null; then
    green "✔ PostgreSQL local déjà actif"
    return 0
  fi

  if command -v pg_ctlcluster > /dev/null 2>&1; then
    pg_ctlcluster 16 main start 2>/dev/null || pg_ctlcluster 15 main start 2>/dev/null || true
  elif command -v pg_ctl > /dev/null 2>&1; then
    pg_ctl start -D /var/lib/postgresql/data 2>/dev/null || true
  fi

  sleep 2
  if pg_isready -q 2>/dev/null; then
    green "✔ PostgreSQL local démarré"

    # Créer la base si elle n'existe pas
    DB_NAME=$(echo "$DATABASE_URL" | sed 's|.*/||' | cut -d'?' -f1)
    if [ -n "$DB_NAME" ]; then
      sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null \
        | grep -q 1 \
        || sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null \
        && green "✔ Base '$DB_NAME' prête"
    fi
    return 0
  fi

  red "✗ Impossible de démarrer PostgreSQL localement"
  return 1
}

# Charger DATABASE_URL depuis .env
export $(grep -E '^DATABASE_URL=' .env | xargs)

if command -v docker > /dev/null 2>&1 && [ -f docker-compose.yml ]; then
  start_postgres_docker
elif command -v pg_isready > /dev/null 2>&1; then
  start_postgres_local
else
  red "✗ Ni Docker ni PostgreSQL trouvés."
  red "  Installe Docker (recommandé) ou PostgreSQL, puis relance ce script."
  exit 1
fi

# ── 4. Build frontend ──────────────────────────────────────────────
yellow "⏳ Build du frontend…"
npm run build
green "✔ Frontend compilé"

# ── Terminé ─────────────────────────────────────────────────────────
echo ""
green "🚀 Setup terminé ! Lance le serveur avec :"
echo "   npm start"
echo ""
