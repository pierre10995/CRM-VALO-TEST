import pg from "pg";
import { config } from "./config.js";
import { supabaseAdmin } from "./supabase.js";

const pool = new pg.Pool({
  connectionString: config.db.connectionString,
  ssl: config.db.ssl,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth_id UUID UNIQUE,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) DEFAULT '',
        full_name VARCHAR(100) NOT NULL
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
    // Ensure existing admin user has admin role
    await client.query(`UPDATE users SET role = 'admin' WHERE login = 'pierre@valo-inno.com' AND role = 'user'`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
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

    const newCols = [
      ["city", "VARCHAR(100) DEFAULT ''"],
      ["linkedin", "VARCHAR(200) DEFAULT ''"],
      ["skills", "TEXT DEFAULT ''"],
      ["salary_expectation", "NUMERIC DEFAULT 0"],
      ["availability", "VARCHAR(50) DEFAULT ''"],
      ["validation_status", "VARCHAR(30) DEFAULT ''"],
      ["target_position", "VARCHAR(200) DEFAULT ''"],
      ["owner", "VARCHAR(100) DEFAULT ''"],
    ];
    for (const [col, type] of newCols) {
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ${col} ${type}`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS fiscal_years (
        id SERIAL PRIMARY KEY,
        label VARCHAR(20) NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        target NUMERIC DEFAULT 0
      );
    `);

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
        deadline DATE,
        fiscal_year_id INTEGER REFERENCES fiscal_years(id) ON DELETE SET NULL
      );
    `);

    await client.query(`ALTER TABLE missions ADD COLUMN IF NOT EXISTS fiscal_year_id INTEGER REFERENCES fiscal_years(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE missions ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50) DEFAULT ''`);
    await client.query(`ALTER TABLE missions ADD COLUMN IF NOT EXISTS partner_notes TEXT DEFAULT ''`);

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
        mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
        file_type VARCHAR(30) NOT NULL,
        file_name VARCHAR(200) NOT NULL,
        mime_type VARCHAR(100) DEFAULT 'application/pdf',
        file_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS placements (
        id SERIAL PRIMARY KEY,
        candidature_id INTEGER REFERENCES candidatures(id) ON DELETE CASCADE,
        candidate_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
        company VARCHAR(100) DEFAULT '',
        start_date DATE,
        probation_date DATE,
        start_invoice_sent BOOLEAN DEFAULT FALSE,
        start_invoice_name VARCHAR(200) DEFAULT '',
        probation_invoice_sent BOOLEAN DEFAULT FALSE,
        probation_invoice_name VARCHAR(200) DEFAULT '',
        start_invoice_paid BOOLEAN DEFAULT FALSE,
        probation_invoice_paid BOOLEAN DEFAULT FALSE,
        probation_validated BOOLEAN DEFAULT FALSE,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE placements ADD COLUMN IF NOT EXISTS start_invoice_paid BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE placements ADD COLUMN IF NOT EXISTS probation_invoice_paid BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE placements ADD COLUMN IF NOT EXISTS probation_validated BOOLEAN DEFAULT FALSE`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        positives TEXT DEFAULT '',
        negatives TEXT DEFAULT '',
        clarifications TEXT DEFAULT '',
        summary TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(candidate_id, mission_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS objectives (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        period VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER,
        target_new_clients INTEGER DEFAULT 0,
        target_ca NUMERIC DEFAULT 0,
        target_total NUMERIC DEFAULT 0,
        notes TEXT DEFAULT '',
        fiscal_year_id INTEGER REFERENCES fiscal_years(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, period, year, month)
      );
    `);

    await client.query(`ALTER TABLE objectives ADD COLUMN IF NOT EXISTS fiscal_year_id INTEGER REFERENCES fiscal_years(id) ON DELETE SET NULL`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS validation_statuses (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        bg_color VARCHAR(20) DEFAULT '#f1f5f9',
        text_color VARCHAR(20) DEFAULT '#64748b',
        sort_order INTEGER DEFAULT 0
      );
    `);

    // ─── Partners ───────────────────────────────────────────────────────────────

    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        auth_id UUID UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) DEFAULT '',
        company VARCHAR(100) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE`);
    await client.query(`ALTER TABLE partners ALTER COLUMN password SET DEFAULT ''`);
    await client.query(`ALTER TABLE partners ALTER COLUMN password DROP NOT NULL`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_missions (
        id SERIAL PRIMARY KEY,
        partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
        mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(partner_id, mission_id)
      );
    `);

    await client.query(`ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS submission_reviews (
        id SERIAL PRIMARY KEY,
        candidature_id INTEGER REFERENCES candidatures(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(candidature_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_notifications (
        id SERIAL PRIMARY KEY,
        partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
        candidature_id INTEGER REFERENCES candidatures(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS candidature_comments (
        id SERIAL PRIMARY KEY,
        candidature_id INTEGER REFERENCES candidatures(id) ON DELETE CASCADE,
        author_type VARCHAR(10) NOT NULL CHECK (author_type IN ('internal', 'partner')),
        author_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        visible_to_partner BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        action VARCHAR(30) NOT NULL,
        entity_type VARCHAR(30) NOT NULL,
        entity_id INTEGER,
        details TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        label VARCHAR(50) NOT NULL UNIQUE,
        color VARCHAR(20) DEFAULT '#3b82f6'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_tags (
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (contact_id, tag_id)
      );
    `);

    // ─── Row Level Security ────────────────────────────────────────────────────
    // Toutes les requêtes passent par le backend Express (service_role).
    // On active RLS et on n'ajoute aucune policy pour la clé anon/public,
    // ce qui bloque tout accès direct via l'API REST PostgREST de Supabase.
    const allTables = [
      "users", "password_resets", "contacts", "fiscal_years", "missions",
      "candidatures", "activities", "files", "placements", "evaluations",
      "objectives", "validation_statuses", "partners", "partner_missions",
      "submission_reviews", "partner_notifications", "candidature_comments",
      "audit_log", "tags", "contact_tags",
    ];
    for (const table of allTables) {
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }

    // Seed tracking
    await client.query(`CREATE TABLE IF NOT EXISTS seed_log (key VARCHAR(50) PRIMARY KEY, done_at TIMESTAMP DEFAULT NOW())`);
    const alreadySeeded = async (key) => {
      const { rows } = await client.query("SELECT 1 FROM seed_log WHERE key = $1", [key]);
      return rows.length > 0;
    };
    const markSeeded = async (key) => {
      await client.query("INSERT INTO seed_log (key) VALUES ($1) ON CONFLICT DO NOTHING", [key]);
    };

    if (!await alreadySeeded("fiscal_years")) {
      const { rows: existingYears } = await client.query("SELECT COUNT(*) FROM fiscal_years");
      if (parseInt(existingYears[0].count) === 0) {
        await client.query(`
          INSERT INTO fiscal_years (label, start_date, end_date, target) VALUES
          ('Année 1 - 2024-2025', '2024-05-06', '2025-04-30', 100000),
          ('Année 2 - 2025-2026', '2025-05-01', '2026-04-30', 150000),
          ('Année 3 - 2026-2027', '2026-05-01', '2027-04-30', 200000)
        `);
      }
      await markSeeded("fiscal_years");
    }

    if (!await alreadySeeded("users")) {
      const { rows: existingUsers } = await client.query("SELECT COUNT(*) FROM users");
      if (parseInt(existingUsers[0].count) === 0) {
        const seedUsers = [
          { email: "oceane@valo-inno.com", password: process.env.SEED_PWD_OCEANE || "oceane2026", fullName: "Océane Le Goff" },
          { email: "pierre@valo-inno.com", password: process.env.SEED_PWD_PIERRE || "pierre2026", fullName: "Pierre Scelles" },
        ];
        for (const u of seedUsers) {
          // Créer l'utilisateur dans Supabase Auth
          const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.fullName, role: "admin" },
          });
          if (authErr) {
            // Si l'utilisateur existe déjà dans Supabase Auth, récupérer son ID
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            const existing = listData?.users?.find(su => su.email === u.email);
            const authId = existing?.id || null;
            await client.query(
              "INSERT INTO users (login, full_name, auth_id) VALUES ($1, $2, $3) ON CONFLICT (login) DO UPDATE SET auth_id = $3",
              [u.email, u.fullName, authId]
            );
          } else {
            await client.query(
              "INSERT INTO users (login, full_name, auth_id) VALUES ($1, $2, $3)",
              [u.email, u.fullName, authUser.user.id]
            );
          }
        }
        console.log("Users seeded (Supabase Auth)");
      }
      await markSeeded("users");
    }

    await client.query("UPDATE users SET login = 'oceane@valo-inno.com' WHERE login = 'oceane'");
    await client.query("UPDATE users SET login = 'pierre@valo-inno.com' WHERE login = 'pierre'");

    if (!await alreadySeeded("contacts")) {
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
      await markSeeded("contacts");
    }

    if (!await alreadySeeded("missions")) {
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
      await markSeeded("missions");
    }

    if (!await alreadySeeded("validation_statuses")) {
      const { rows: existingVS } = await client.query("SELECT COUNT(*) FROM validation_statuses");
      if (parseInt(existingVS[0].count) === 0) {
        await client.query(`
          INSERT INTO validation_statuses (label, bg_color, text_color, sort_order) VALUES
          ('Validé', '#d1fae5', '#059669', 1),
          ('À moitié Validé', '#fef3c7', '#d97706', 2),
          ('Doute', '#e0e7ff', '#4f46e5', 3),
          ('Refusé par VALO', '#fee2e2', '#dc2626', 4),
          ('Refusé par le client', '#fce7f3', '#be185d', 5)
        `);
      }
      await markSeeded("validation_statuses");
    }

  } finally {
    client.release();
  }
}

export { pool, initDB };
