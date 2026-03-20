# Plan : Vue Partenaire Externe (Recruteur indépendant)

## Résumé
Ajouter un portail partenaire permettant à des recruteurs externes de :
- Se connecter avec leurs propres identifiants
- Voir uniquement les missions auxquelles ils sont affiliés
- Soumettre des candidats (nom, résumé, CV PDF) sur ces missions

## 1. Base de données

### Table `partners`
```sql
CREATE TABLE partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  company VARCHAR(100) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table `partner_missions` (liaison partenaire ↔ mission)
```sql
CREATE TABLE partner_missions (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
  mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, mission_id)
);
```

### Colonne `partner_id` sur `candidatures`
```sql
ALTER TABLE candidatures ADD COLUMN partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;
```
→ Pour tracer quel partenaire a soumis un candidat.

## 2. Backend — Routes API

### Auth partenaire (`server/routes/partner-auth.js`)
- `POST /api/partner/login` — Login partenaire (JWT avec `role: "partner"`)
- `POST /api/partner/logout` — Logout

### Routes partenaire (`server/routes/partner.js`)
Protégées par un middleware `partnerAuthMiddleware` (vérifie `role === "partner"` dans le JWT).

- `GET /api/partner/missions` — Missions affiliées au partenaire (via partner_missions)
- `GET /api/partner/missions/:id` — Détail d'une mission (si affilié)
- `GET /api/partner/candidatures` — Candidatures soumises par ce partenaire
- `POST /api/partner/submit` — Soumettre un candidat :
  - Reçoit : `{ missionId, name, email, phone, summary, fileData, fileName }`
  - Crée le contact (status = "Candidat")
  - Crée la candidature (stage = "Soumis", partner_id = partenaire, notes = summary)
  - Stocke le CV dans files

### Admin : gestion des partenaires (dans routes existantes stats.js ou nouveau)
- `GET /api/partners` — Lister les partenaires
- `POST /api/partners` — Créer un partenaire
- `PUT /api/partners/:id` — Modifier
- `DELETE /api/partners/:id` — Supprimer
- `POST /api/partners/:id/missions` — Affilier une mission
- `DELETE /api/partners/:id/missions/:missionId` — Retirer une affiliation

## 3. Frontend

### Portail partenaire (`src/components/partner/`)
Quand un partenaire se connecte, App.jsx détecte `role === "partner"` et affiche un UI dédié :

- **PartnerPortal.jsx** — Layout principal partenaire
- **PartnerMissionList.jsx** — Liste des missions affiliées (titre, entreprise, lieu, type contrat, salaire)
- **PartnerMissionDetail.jsx** — Détail mission + liste des candidats soumis + bouton "Soumettre un candidat"
- **PartnerSubmitForm.jsx** — Formulaire : nom, email, téléphone, résumé, upload CV (PDF)

### Côté admin (interne)
- **PartenairesPage.jsx** — Page de gestion des partenaires (CRUD)
- Dans la fiche mission, un onglet/section pour gérer les partenaires affiliés
- Dans la liste des candidatures, afficher le nom du partenaire qui a soumis

## 4. Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `server/db.js` | Tables partners, partner_missions, colonne partner_id |
| `server/middleware.js` | Nouveau `partnerAuthMiddleware` |
| `server/validators/schemas.js` | Schémas partenaire |
| `server/routes/partner-auth.js` | **Nouveau** — Auth partenaire |
| `server/routes/partner.js` | **Nouveau** — Routes partenaire |
| `server/routes/partners-admin.js` | **Nouveau** — CRUD partenaires (admin) |
| `server/routes/candidatures.js` | Ajouter partner_id au formatter |
| `server.js` | Monter les nouvelles routes |
| `server/formatters.js` | Ajouter fmtPartner, mettre à jour fmtCandidature |
| `src/App.jsx` | Détecter rôle, afficher portail partenaire |
| `src/components/partner/*.jsx` | **Nouveaux** — UI partenaire |
| `src/components/pages/PartenairesPage.jsx` | **Nouveau** — Gestion admin |
| `src/components/Sidebar.jsx` | Ajouter onglet "Partenaires" |

## 5. Sécurité
- JWT partenaire contient `role: "partner"` → middleware dédié
- Un partenaire ne peut accéder qu'à ses missions affiliées (vérification en DB)
- Upload CV : mêmes validations que l'existant (PDF only, 8MB max)
- Rate limiting sur les routes partenaire (uploadLimiter)
