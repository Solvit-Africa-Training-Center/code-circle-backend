import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClubFeatures1706928000000 implements MigrationInterface {
  name = 'AddClubFeatures1706928000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // add nullable columns (safe): application will populate required values for new rows
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "publicId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "slug" varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "privacy" varchar(32) DEFAULT 'public'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "coverImageUrl" varchar(1024)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT array[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "settings" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "membersCount" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "maxMembers" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "requiresApproval" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "lastActivityAt" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "archivedAt" timestamptz`,
    );

    // indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_clubs_tags_gin" ON "clubs" USING gin ("tags")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_clubs_publicId_unique" ON "clubs" ("publicId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_clubs_slug_unique" ON "clubs" ("slug")`,
    );

    // create lightweight membership table (userId is integer for now)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "club_members" (
        "id" serial PRIMARY KEY,
        "clubId" integer NOT NULL,
        "userId" integer NOT NULL,
        "role" varchar(50) NOT NULL DEFAULT 'member',
        "joinedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("clubId", "userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_club_members_clubId" ON "club_members" ("clubId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_club_members_userId" ON "club_members" ("userId")`,
    );

    // best-effort backfill for slug from name (safe SQL that won't fail if name is null)
    await queryRunner.query(`
      UPDATE "clubs"
      SET "slug" = lower(regexp_replace(coalesce(name, ''), '[^a-z0-9]+', '-', 'g'))
      WHERE "slug" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "club_members"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_club_members_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_club_members_clubId"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_clubs_tags_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_clubs_publicId_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_clubs_slug_unique"`);

    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "publicId"`,
    );
    await queryRunner.query(`ALTER TABLE "clubs" DROP COLUMN IF EXISTS "slug"`);
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "privacy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "coverImageUrl"`,
    );
    await queryRunner.query(`ALTER TABLE "clubs" DROP COLUMN IF EXISTS "tags"`);
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "settings"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "membersCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "maxMembers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "isFeatured"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "requiresApproval"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "lastActivityAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "archivedAt"`,
    );
  }
}
