# VALO Recrutement — CRM

CRM interne de VALO Recrutement : clients/prospects, candidats, postes, pipeline, activités, placements, chiffre d'affaires, objectifs, portail partenaires.

- **Front** : React 18 + Vite (`src/`)
- **Back** : Node 22 + Express (`server.js`, `server/`) + PostgreSQL
- **Auth** : Supabase Auth (identifiants), session JWT en cookie httpOnly
- **IA** : Anthropic (import CV, matching, évaluation, résumé)
- **Hébergement** : Railway (`railway.toml`), base PostgreSQL (Supabase)

## Démarrage local

```bash
cp .env.example .env        # puis renseigner DATABASE_URL, SUPABASE_*, etc.
docker compose up -d        # PostgreSQL local (optionnel)
npm ci
npm run dev                 # front Vite
npm start                   # API Express (autre terminal)
```

Le schéma est créé/migré automatiquement au démarrage (`server/db.js`, idempotent). Les données de démonstration ne sont insérées qu'en dehors de la production.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Front en développement |
| `npm start` | Serveur (sert `dist/` + API) |
| `npm run build` | Build de production (`dist/`) |
| `npm test` | Tests (Vitest) — exécutés aussi au déploiement |
| `npm run backup` | Sauvegarde `pg_dump` (voir ci-dessous) |

## Variables d'environnement

Voir `.env.example`. Obligatoires : `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, et en production `JWT_SECRET`. Le serveur refuse de démarrer si elles manquent ; les clés optionnelles absentes (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`) sont signalées au démarrage.

## Rôles

| Rôle | Droits |
|---|---|
| `user` | CRM opérationnel (clients, candidats, postes, pipeline, activités), CA global en lecture |
| `admin` | + données financières, objectifs, placements (facturation), gestion des utilisateurs (hors super admin) |
| `superadmin` | + rôles, suppression d'utilisateurs, partenaires, années fiscales, journal d'audit complet |

Les rôles se modifient depuis **Administration** (super admin). Le rôle est relu en base à chaque requête.

## Déploiement (Railway)

1. Pousser sur `main` → Railway exécute `npm ci && npm test && npm run build` puis `npm start`.
2. Health check : `GET /health` (vérifie la base). Un déploiement dont les tests échouent n'est pas mis en ligne.
3. **Rollback** : Railway → Deployments → « Redeploy » d'un déploiement précédent. Le schéma étant additif (aucune suppression de colonne au boot), un rollback applicatif est sûr.
4. Après déploiement, recharger le CRM (Ctrl/Cmd+Shift+R) : `index.html` n'est jamais mis en cache, les assets le sont un an (hashés).

## Sauvegardes

Aucune sauvegarde n'est faite par l'application elle-même. Deux niveaux :

1. **Supabase** : activer les sauvegardes quotidiennes / PITR selon le plan (Pro = 7 jours).
2. **Sauvegarde logique** : `DATABASE_URL=... npm run backup` produit `backups/crm-<date>.dump` (rotation 30 jours). À planifier (cron, GitHub Actions) et à copier vers un stockage chiffré. Restauration : `pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" fichier.dump`.

Tester une restauration au moins une fois par trimestre.

## Runbook

| Symptôme | Cause probable | Action |
|---|---|---|
| Boucle de redémarrage | Variable obligatoire absente (`JWT_SECRET`, `DATABASE_URL`, `SUPABASE_*`) | Vérifier les logs de démarrage (« FATAL: … ») |
| `/health` → 503 | Base injoignable | Vérifier Supabase / `DATABASE_URL` / pooler |
| Import CV « Erreur lors du traitement » | `ANTHROPIC_API_KEY` absente ou modèle indisponible | Renseigner la clé ; changer `ANTHROPIC_MODEL` |
| Emails non reçus | `RESEND_API_KEY` absente ou domaine expéditeur non vérifié | Configurer Resend avec un domaine vérifié |
| « Je ne vois pas les changements » | Commits non fusionnés dans `main` | Vérifier la PR / le déploiement Railway |

## Sécurité — points d'attention

- Les fichiers (CV, PDF) sont stockés dans la base en base64 : prévoir une migration vers un stockage objet (Supabase Storage) et une politique de rétention (RGPD / Loi 25).
- `DB_SSL_STRICT=true` recommandé en production une fois le certificat de la base disponible.
