import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ─── PostgreSQL ──────────────────────────────────────────────────────────────
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        company VARCHAR(100) NOT NULL,
        email VARCHAR(100) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        status VARCHAR(20) DEFAULT 'Prospect',
        sector VARCHAR(50) DEFAULT 'Tech',
        revenue NUMERIC DEFAULT 0,
        notes TEXT DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        linkedin VARCHAR(200) DEFAULT '',
        skills TEXT DEFAULT '',
        salary_expectation NUMERIC DEFAULT 0,
        availability VARCHAR(50) DEFAULT '',
        created_at DATE DEFAULT CURRENT_DATE
      );
    `);

    // Add new columns if they don't exist (for existing databases)
    const newCols = [
      ["city", "VARCHAR(100) DEFAULT ''"],
      ["linkedin", "VARCHAR(200) DEFAULT ''"],
      ["skills", "TEXT DEFAULT ''"],
      ["salary_expectation", "NUMERIC DEFAULT 0"],
      ["availability", "VARCHAR(50) DEFAULT ''"],
    ];
    for (const [col, type] of newCols) {
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ${col} ${type}`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS missions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        client_contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        company VARCHAR(100) NOT NULL,
        location VARCHAR(100) DEFAULT '',
        contract_type VARCHAR(50) DEFAULT 'CDI',
        salary_min NUMERIC DEFAULT 0,
        salary_max NUMERIC DEFAULT 0,
        description TEXT DEFAULT '',
        requirements TEXT DEFAULT '',
        status VARCHAR(30) DEFAULT 'Ouverte',
        priority VARCHAR(20) DEFAULT 'Normale',
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        commission NUMERIC DEFAULT 0,
        created_at DATE DEFAULT CURRENT_DATE,
        deadline DATE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS candidatures (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
        stage VARCHAR(30) DEFAULT 'Soumis',
        rating INTEGER DEFAULT 0,
        notes TEXT DEFAULT '',
        interview_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        mission_id INTEGER REFERENCES missions(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(30) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        description TEXT DEFAULT '',
        due_date TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        file_type VARCHAR(30) NOT NULL,
        file_name VARCHAR(200) NOT NULL,
        mime_type VARCHAR(100) DEFAULT 'application/pdf',
        file_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed users
    const { rows: existingUsers } = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(existingUsers[0].count) === 0) {
      const hash1 = bcrypt.hashSync("oceane2026", 10);
      const hash2 = bcrypt.hashSync("pierre2026", 10);
      await client.query(
        "INSERT INTO users (login, password, full_name) VALUES ($1, $2, $3), ($4, $5, $6)",
        ["oceane", hash1, "Océane Le Goff", "pierre", hash2, "Pierre Scelles"]
      );
      console.log("Users seeded");
    }

    // Seed contacts
    const { rows: existingContacts } = await client.query("SELECT COUNT(*) FROM contacts");
    if (parseInt(existingContacts[0].count) === 0) {
      await client.query(`
        INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, city, skills, salary_expectation, availability, created_at) VALUES
        ('Sophie Martin', 'TechCorp', 's.martin@techcorp.ca', '(514) 555-1234', 'Client', 'Tech', 24000, 'Partenaire stratégique depuis 2023', 'Montréal', '', 0, '', '2024-01-15'),
        ('Julien Bernard', 'FinanceHub', 'j.bernard@financehub.ca', '(438) 555-9876', 'Prospect', 'Finance', 0, 'Intéressé par nos services RH', 'Toronto', '', 0, '', '2024-03-10'),
        ('Emma Durand', 'HealthFirst', 'e.durand@healthfirst.ca', '(418) 555-1122', 'Candidat', 'Santé', 0, 'Profil senior, disponible en mars', 'Québec', 'Gestion de projet, Santé, Leadership', 85000, 'Immédiate', '2024-04-20'),
        ('Thomas Petit', 'RetailGroup', 't.petit@retailgroup.ca', '(613) 555-4433', 'Client', 'Retail', 38000, 'Contrat annuel renouvelé', 'Ottawa', '', 0, '', '2024-02-01'),
        ('Camille Moreau', 'IndusPro', 'c.moreau@induspro.ca', '(819) 555-6677', 'Prospect', 'Industrie', 0, 'RDV prévu le 20 avril', 'Sherbrooke', '', 0, '', '2024-05-05'),
        ('Marc Tremblay', '', 'marc.tremblay@gmail.com', '(514) 555-8899', 'Candidat', 'Tech', 0, 'Développeur Full Stack 5 ans exp', 'Montréal', 'React, Node.js, PostgreSQL, TypeScript', 95000, '2 semaines', '2024-06-01'),
        ('Isabelle Roy', '', 'i.roy@outlook.com', '(438) 555-2211', 'Candidat', 'Finance', 0, 'Analyste financier CFA', 'Montréal', 'Analyse financière, Excel, Python, CFA', 78000, '1 mois', '2024-06-15'),
        ('David Chen', 'DataViz Inc', 'd.chen@dataviz.ca', '(514) 555-3344', 'Client', 'Tech', 45000, 'Recherche profils data régulièrement', 'Montréal', '', 0, '', '2024-03-20')
      `);
      console.log("Contacts seeded");
    }

    // Seed missions
    const { rows: existingMissions } = await client.query("SELECT COUNT(*) FROM missions");
    if (parseInt(existingMissions[0].count) === 0) {
      await client.query(`
        INSERT INTO missions (title, company, location, contract_type, salary_min, salary_max, description, requirements, status, priority, commission, deadline) VALUES
        ('Développeur Full Stack Senior', 'TechCorp', 'Montréal', 'CDI', 85000, 105000, 'Développement d''applications web pour clients majeurs', 'React, Node.js, 5+ ans exp', 'Ouverte', 'Haute', 8000, '2024-08-01'),
        ('Analyste Financier', 'FinanceHub', 'Toronto', 'CDI', 70000, 90000, 'Analyse de portefeuilles et reporting', 'CFA requis, Excel avancé, 3+ ans', 'Ouverte', 'Normale', 6000, '2024-07-15'),
        ('Chef de Projet Santé', 'HealthFirst', 'Québec', 'Contrat', 75000, 95000, 'Gestion de projets de transformation digitale', 'PMP, expérience santé, bilingue', 'En cours', 'Haute', 7500, '2024-09-01'),
        ('Data Analyst', 'DataViz Inc', 'Montréal', 'CDI', 65000, 80000, 'Analyse de données et visualisation', 'Python, SQL, Tableau, 2+ ans', 'Ouverte', 'Normale', 5000, '2024-08-15')
      `);
      console.log("Missions seeded");
    }

  } finally {
    client.release();
  }
}

// ─── Helper: format contact row ─────────────────────────────────────────────
function fmtContact(r) {
  return {
    id: r.id, name: r.name, company: r.company, email: r.email, phone: r.phone,
    status: r.status, sector: r.sector, revenue: Number(r.revenue), notes: r.notes,
    city: r.city || "", linkedin: r.linkedin || "", skills: r.skills || "",
    salaryExpectation: Number(r.salary_expectation) || 0, availability: r.availability || "",
    createdAt: r.created_at,
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  const { login, password } = req.body;
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
    if (rows.length === 0) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    res.json({ id: user.id, login: user.login, fullName: user.full_name });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── Contacts CRUD ───────────────────────────────────────────────────────────
app.get("/api/contacts", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM contacts ORDER BY id ASC");
    res.json(rows.map(fmtContact));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.post("/api/contacts", async (req, res) => {
  const { name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salaryExpectation, availability } = req.body;
  if (!name) return res.status(400).json({ error: "Nom requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salary_expectation, availability)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, company || "", email || "", phone || "", status || "Candidat", sector || "Tech", Number(revenue) || 0, notes || "", city || "", linkedin || "", skills || "", Number(salaryExpectation) || 0, availability || ""]
    );
    res.json(fmtContact(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.put("/api/contacts/:id", async (req, res) => {
  const { name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salaryExpectation, availability } = req.body;
  if (!name) return res.status(400).json({ error: "Nom requis" });
  try {
    const { rows } = await pool.query(
      `UPDATE contacts SET name=$1, company=$2, email=$3, phone=$4, status=$5, sector=$6, revenue=$7, notes=$8, city=$9, linkedin=$10, skills=$11, salary_expectation=$12, availability=$13 WHERE id=$14 RETURNING *`,
      [name, company || "", email || "", phone || "", status || "Candidat", sector || "Tech", Number(revenue) || 0, notes || "", city || "", linkedin || "", skills || "", Number(salaryExpectation) || 0, availability || "", req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Contact non trouvé" });
    res.json(fmtContact(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/contacts/:id", async (req, res) => {
  try { await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ─── Missions CRUD ───────────────────────────────────────────────────────────
function fmtMission(r) {
  return {
    id: r.id, title: r.title, clientContactId: r.client_contact_id, company: r.company,
    location: r.location || "", contractType: r.contract_type || "CDI",
    salaryMin: Number(r.salary_min) || 0, salaryMax: Number(r.salary_max) || 0,
    description: r.description || "", requirements: r.requirements || "",
    status: r.status, priority: r.priority || "Normale",
    assignedTo: r.assigned_to, commission: Number(r.commission) || 0,
    createdAt: r.created_at, deadline: r.deadline,
    clientName: r.client_name || "", assignedName: r.assigned_name || "",
    candidatureCount: parseInt(r.candidature_count) || 0,
  };
}

app.get("/api/missions", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, c.name as client_name, u.full_name as assigned_name,
        (SELECT COUNT(*) FROM candidatures WHERE mission_id = m.id) as candidature_count
      FROM missions m
      LEFT JOIN contacts c ON m.client_contact_id = c.id
      LEFT JOIN users u ON m.assigned_to = u.id
      ORDER BY m.created_at DESC
    `);
    res.json(rows.map(fmtMission));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.post("/api/missions", async (req, res) => {
  const { title, clientContactId, company, location, contractType, salaryMin, salaryMax, description, requirements, status, priority, assignedTo, commission, deadline } = req.body;
  if (!title || !company) return res.status(400).json({ error: "Titre et entreprise requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO missions (title, client_contact_id, company, location, contract_type, salary_min, salary_max, description, requirements, status, priority, assigned_to, commission, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [title, clientContactId || null, company, location || "", contractType || "CDI", Number(salaryMin) || 0, Number(salaryMax) || 0, description || "", requirements || "", status || "Ouverte", priority || "Normale", assignedTo || null, Number(commission) || 0, deadline || null]
    );
    res.json(fmtMission(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.put("/api/missions/:id", async (req, res) => {
  const { title, clientContactId, company, location, contractType, salaryMin, salaryMax, description, requirements, status, priority, assignedTo, commission, deadline } = req.body;
  if (!title || !company) return res.status(400).json({ error: "Titre et entreprise requis" });
  try {
    const { rows } = await pool.query(
      `UPDATE missions SET title=$1, client_contact_id=$2, company=$3, location=$4, contract_type=$5, salary_min=$6, salary_max=$7, description=$8, requirements=$9, status=$10, priority=$11, assigned_to=$12, commission=$13, deadline=$14 WHERE id=$15 RETURNING *`,
      [title, clientContactId || null, company, location || "", contractType || "CDI", Number(salaryMin) || 0, Number(salaryMax) || 0, description || "", requirements || "", status || "Ouverte", priority || "Normale", assignedTo || null, Number(commission) || 0, deadline || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Mission non trouvée" });
    res.json(fmtMission(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/missions/:id", async (req, res) => {
  try { await pool.query("DELETE FROM missions WHERE id = $1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ─── Candidatures CRUD ──────────────────────────────────────────────────────
function fmtCandidature(r) {
  return {
    id: r.id, candidateId: r.candidate_id, missionId: r.mission_id,
    stage: r.stage, rating: r.rating || 0, notes: r.notes || "",
    interviewDate: r.interview_date, createdAt: r.created_at, updatedAt: r.updated_at,
    candidateName: r.candidate_name || "", candidateEmail: r.candidate_email || "",
    candidatePhone: r.candidate_phone || "", candidateSkills: r.candidate_skills || "",
    missionTitle: r.mission_title || "", missionCompany: r.mission_company || "",
  };
}

app.get("/api/candidatures", async (req, res) => {
  const { missionId, candidateId } = req.query;
  try {
    let q = `SELECT cd.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone, c.skills as candidate_skills,
             m.title as mission_title, m.company as mission_company
             FROM candidatures cd
             LEFT JOIN contacts c ON cd.candidate_id = c.id
             LEFT JOIN missions m ON cd.mission_id = m.id`;
    const params = [];
    if (missionId) { q += " WHERE cd.mission_id = $1"; params.push(missionId); }
    else if (candidateId) { q += " WHERE cd.candidate_id = $1"; params.push(candidateId); }
    q += " ORDER BY cd.created_at DESC";
    const { rows } = await pool.query(q, params);
    res.json(rows.map(fmtCandidature));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.post("/api/candidatures", async (req, res) => {
  const { candidateId, missionId, stage, rating, notes, interviewDate } = req.body;
  if (!candidateId || !missionId) return res.status(400).json({ error: "Candidat et mission requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO candidatures (candidate_id, mission_id, stage, rating, notes, interview_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [candidateId, missionId, stage || "Soumis", rating || 0, notes || "", interviewDate || null]
    );
    res.json(fmtCandidature(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.put("/api/candidatures/:id", async (req, res) => {
  const { stage, rating, notes, interviewDate } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE candidatures SET stage=$1, rating=$2, notes=$3, interview_date=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [stage || "Soumis", rating || 0, notes || "", interviewDate || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Candidature non trouvée" });
    res.json(fmtCandidature(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/candidatures/:id", async (req, res) => {
  try { await pool.query("DELETE FROM candidatures WHERE id = $1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ─── Activities CRUD ─────────────────────────────────────────────────────────
function fmtActivity(r) {
  return {
    id: r.id, contactId: r.contact_id, missionId: r.mission_id, userId: r.user_id,
    type: r.type, subject: r.subject, description: r.description || "",
    dueDate: r.due_date, completed: r.completed, createdAt: r.created_at,
    contactName: r.contact_name || "", userName: r.user_name || "",
  };
}

app.get("/api/activities", async (req, res) => {
  const { contactId } = req.query;
  try {
    let q = `SELECT a.*, c.name as contact_name, u.full_name as user_name
             FROM activities a
             LEFT JOIN contacts c ON a.contact_id = c.id
             LEFT JOIN users u ON a.user_id = u.id`;
    const params = [];
    if (contactId) { q += " WHERE a.contact_id = $1"; params.push(contactId); }
    q += " ORDER BY a.created_at DESC LIMIT 100";
    const { rows } = await pool.query(q, params);
    res.json(rows.map(fmtActivity));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.post("/api/activities", async (req, res) => {
  const { contactId, missionId, userId, type, subject, description, dueDate } = req.body;
  if (!type || !subject) return res.status(400).json({ error: "Type et sujet requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO activities (contact_id, mission_id, user_id, type, subject, description, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [contactId || null, missionId || null, userId || null, type, subject, description || "", dueDate || null]
    );
    res.json(fmtActivity(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.put("/api/activities/:id", async (req, res) => {
  const { completed } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE activities SET completed=$1 WHERE id=$2 RETURNING *`,
      [completed, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Activité non trouvée" });
    res.json(fmtActivity(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/activities/:id", async (req, res) => {
  try { await pool.query("DELETE FROM activities WHERE id = $1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ─── Dashboard stats ─────────────────────────────────────────────────────────
app.get("/api/stats", async (req, res) => {
  try {
    const contacts = await pool.query("SELECT status, COUNT(*) as count FROM contacts GROUP BY status");
    const missions = await pool.query("SELECT status, COUNT(*) as count FROM missions GROUP BY status");
    const revenue = await pool.query("SELECT COALESCE(SUM(revenue),0) as total FROM contacts WHERE status='Client'");
    const placements = await pool.query("SELECT COUNT(*) as count FROM candidatures WHERE stage='Placé'");
    const pending = await pool.query("SELECT COUNT(*) as count FROM activities WHERE completed=false");
    const commissions = await pool.query("SELECT COALESCE(SUM(m.commission),0) as total FROM candidatures cd JOIN missions m ON cd.mission_id=m.id WHERE cd.stage='Placé'");
    res.json({
      contacts: contacts.rows,
      missions: missions.rows,
      totalRevenue: Number(revenue.rows[0].total),
      totalPlacements: parseInt(placements.rows[0].count),
      pendingActivities: parseInt(pending.rows[0].count),
      totalCommissions: Number(commissions.rows[0].total),
    });
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ─── Users list (for assignment dropdowns) ───────────────────────────────────
app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, login, full_name FROM users ORDER BY id");
    res.json(rows.map(r => ({ id: r.id, login: r.login, fullName: r.full_name })));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ─── Files (CV, comptes-rendus) ─────────────────────────────────────────────
app.post("/api/files", async (req, res) => {
  try {
    const { contactId, fileType, fileName, mimeType, fileData } = req.body;
    if (!contactId || !fileType || !fileName || !fileData) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }
    const { rows } = await pool.query(
      `INSERT INTO files (contact_id, file_type, file_name, mime_type, file_data)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, contact_id, file_type, file_name, mime_type, created_at`,
      [contactId, fileType, fileName, mimeType || "application/pdf", fileData]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

app.get("/api/files/contact/:contactId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, contact_id, file_type, file_name, mime_type, created_at FROM files WHERE contact_id=$1 ORDER BY created_at DESC",
      [req.params.contactId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.get("/api/files/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM files WHERE id=$1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Fichier non trouvé" });
    const file = rows[0];
    const buffer = Buffer.from(file.file_data, "base64");
    res.setHeader("Content-Type", file.mime_type);
    res.setHeader("Content-Disposition", `attachment; filename="${file.file_name}"`);
    res.send(buffer);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/files/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM files WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ─── Serve frontend ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ─── Start ───────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`VALO Recrutement CRM running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
