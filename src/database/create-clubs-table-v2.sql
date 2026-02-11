-- Usage: \i path/to/create-clubs-table-v2.sql   (in psql)
-- Creates the clubs table for the trimmed schema.

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table only if you want a clean slate (removes all data)
-- DROP TABLE IF EXISTS clubs;

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

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_clubs_name" ON clubs (name);

ALTER TABLE clubs
  ADD CONSTRAINT IF NOT EXISTS "FK_clubs_categoryId"
  FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE RESTRICT;

ALTER TABLE clubs
  ADD CONSTRAINT IF NOT EXISTS "FK_clubs_creatorId"
  FOREIGN KEY ("creatorId") REFERENCES users(id) ON DELETE RESTRICT;
