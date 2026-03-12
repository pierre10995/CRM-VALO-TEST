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
app.use(express.json());

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
        created_at DATE DEFAULT CURRENT_DATE
      );
    `);

    // Seed users if empty
    const { rows: existingUsers } = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(existingUsers[0].count) === 0) {
      const hash1 = bcrypt.hashSync("oceane2026", 10);
      const hash2 = bcrypt.hashSync("pierre2026", 10);
      await client.query(
        "INSERT INTO users (login, password, full_name) VALUES ($1, $2, $3), ($4, $5, $6)",
        ["oceane", hash1, "Océane Le Goff", "pierre", hash2, "Pierre Scelles"]
      );
      console.log("Users seeded: oceane / pierre");
    }

    // Seed contacts if empty
    const { rows: existingContacts } = await client.query("SELECT COUNT(*) FROM contacts");
    if (parseInt(existingContacts[0].count) === 0) {
      await client.query(`
        INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, created_at) VALUES
        ('Sophie Martin', 'TechCorp', 's.martin@techcorp.ca', '(514) 555-1234', 'Client', 'Tech', 24000, 'Partenaire stratégique depuis 2023', '2024-01-15'),
        ('Julien Bernard', 'FinanceHub', 'j.bernard@financehub.ca', '(438) 555-9876', 'Prospect', 'Finance', 0, 'Intéressé par nos services RH', '2024-03-10'),
        ('Emma Durand', 'HealthFirst', 'e.durand@healthfirst.ca', '(418) 555-1122', 'Candidat', 'Santé', 0, 'Profil senior, disponible en mars', '2024-04-20'),
        ('Thomas Petit', 'RetailGroup', 't.petit@retailgroup.ca', '(613) 555-4433', 'Client', 'Retail', 38000, 'Contrat annuel renouvelé', '2024-02-01'),
        ('Camille Moreau', 'IndusPro', 'c.moreau@induspro.ca', '(819) 555-6677', 'Prospect', 'Industrie', 0, 'RDV prévu le 20 avril', '2024-05-05')
      `);
      console.log("Contacts seeded");
    }
  } finally {
    client.release();
  }
}

// ─── Auth routes ─────────────────────────────────────────────────────────────
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
    const contacts = rows.map((r) => ({
      id: r.id,
      name: r.name,
      company: r.company,
      email: r.email,
      phone: r.phone,
      status: r.status,
      sector: r.sector,
      revenue: Number(r.revenue),
      notes: r.notes,
      createdAt: r.created_at,
    }));
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/contacts", async (req, res) => {
  const { name, company, email, phone, status, sector, revenue, notes } = req.body;
  if (!name || !company) return res.status(400).json({ error: "Nom et entreprise requis" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [name, company, email || "", phone || "", status || "Prospect", sector || "Tech", Number(revenue) || 0, notes || ""]
    );
    const r = rows[0];
    res.json({ id: r.id, name: r.name, company: r.company, email: r.email, phone: r.phone, status: r.status, sector: r.sector, revenue: Number(r.revenue), notes: r.notes, createdAt: r.created_at });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const { name, company, email, phone, status, sector, revenue, notes } = req.body;
  if (!name || !company) return res.status(400).json({ error: "Nom et entreprise requis" });
  try {
    const { rows } = await pool.query(
      "UPDATE contacts SET name=$1, company=$2, email=$3, phone=$4, status=$5, sector=$6, revenue=$7, notes=$8 WHERE id=$9 RETURNING *",
      [name, company, email || "", phone || "", status || "Prospect", sector || "Tech", Number(revenue) || 0, notes || "", id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Contact non trouvé" });
    const r = rows[0];
    res.json({ id: r.id, name: r.name, company: r.company, email: r.email, phone: r.phone, status: r.status, sector: r.sector, revenue: Number(r.revenue), notes: r.notes, createdAt: r.created_at });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/contacts/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
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
