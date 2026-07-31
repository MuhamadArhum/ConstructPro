import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const sql = `
-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  description TEXT,
  client_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  site_address TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  budget DECIMAL(18,2) DEFAULT 0,
  spent DECIMAL(18,2) DEFAULT 0,
  status VARCHAR DEFAULT 'Planning',
  progress INT DEFAULT 0,
  manager_name VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  date TIMESTAMP NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_labours (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  labour_id TEXT NOT NULL REFERENCES labours(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, labour_id)
);

CREATE TABLE IF NOT EXISTS project_machineries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  machinery_id TEXT NOT NULL REFERENCES machineries(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, machinery_id)
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_number VARCHAR UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  issue_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP NOT NULL,
  status VARCHAR DEFAULT 'Draft',
  subtotal DECIMAL(18,2) DEFAULT 0,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  total DECIMAL(18,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR NOT NULL,
  quantity DECIMAL(18,2) DEFAULT 1,
  unit_price DECIMAL(18,2) DEFAULT 0,
  total DECIMAL(18,2) DEFAULT 0
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  po_number VARCHAR UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  issue_date TIMESTAMP NOT NULL,
  expected_delivery TIMESTAMP,
  status VARCHAR DEFAULT 'Draft',
  subtotal DECIMAL(18,2) DEFAULT 0,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  total DECIMAL(18,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  description VARCHAR NOT NULL,
  quantity DECIMAL(18,2) DEFAULT 1,
  unit_price DECIMAL(18,2) DEFAULT 0,
  total DECIMAL(18,2) DEFAULT 0
);
`;

async function run() {
  await client.connect();
  console.log('Running migration v2 (Projects + Invoices + Purchase Orders)...');
  await client.query(sql);
  console.log('✅ Migration complete.');
  await client.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
