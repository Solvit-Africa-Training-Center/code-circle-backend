import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrimClubsTable1760040000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_clubs_slug"`,
    );

    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "privacy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "tags"`,
    );
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "slug" varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "privacy" varchar(32) DEFAULT 'public'`,
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
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_clubs_slug" ON "clubs" ("slug")`,
    );
  }
}
