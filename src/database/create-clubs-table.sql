-- Run this script in your PostgreSQL client (psql, pgAdmin, DBeaver)
-- connected to database: CodeCircle_db (or your DB_NAME from .env)
--
-- Usage: \i path/to/create-clubs-table.sql   (in psql)
-- Or paste and run in pgAdmin/DBeaver.

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table only if you want a clean slate (removes all data)
-- DROP TABLE IF EXISTS clubs;

-- Create clubs table with all columns expected by the Club entity
CREATE TABLE IF NOT EXISTS clubs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          varchar(100) NOT NULL UNIQUE,
  "categoryId"  uuid NOT NULL,
  "creatorId"   uuid NOT NULL,
  description   text,
  "isActive"    boolean NOT NULL DEFAULT true,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common lookups (TypeORM creates these via entity decorators)
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_clubs_name" ON clubs (name);

-- Foreign key to categories table (optional)
ALTER TABLE clubs
  ADD CONSTRAINT IF NOT EXISTS "FK_clubs_categoryId"
  FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE RESTRICT;

-- Foreign key to users table (optional)
ALTER TABLE clubs
  ADD CONSTRAINT IF NOT EXISTS "FK_clubs_creatorId"
  FOREIGN KEY ("creatorId") REFERENCES users(id) ON DELETE RESTRICT;

-- If the table already existed with fewer columns, add any missing ones:
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "categoryId" uuid;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "creatorId" uuid;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();
