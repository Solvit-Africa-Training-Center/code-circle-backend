-- Usage: \i path/to/create-categories-table.sql   (in psql)

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table with all columns expected by the Category entity
CREATE TABLE IF NOT EXISTS categories (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         varchar(100) NOT NULL,
  slug         varchar(100) NOT NULL,
  description  text,
  icon         varchar(255),
  "isActive"   boolean NOT NULL DEFAULT true,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_name_unique" ON categories (name);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_slug_unique" ON categories (slug);

-- Seed default categories (idempotent)
INSERT INTO categories (name, slug)
VALUES
  ('datascience', 'datascience'),
  ('ai', 'ai'),
  ('cybersecurity', 'cybersecurity'),
  ('frontend', 'frontend'),
  ('backend', 'backend'),
  ('uiux', 'uiux')
ON CONFLICT DO NOTHING;
