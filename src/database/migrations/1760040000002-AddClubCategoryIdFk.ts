import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClubCategoryIdFk1760040000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "categoryId" integer`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_clubs_categoryId'
        ) THEN
          ALTER TABLE "clubs"
          ADD CONSTRAINT "FK_clubs_categoryId"
          FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "clubs" ALTER COLUMN "categoryId" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clubs" ALTER COLUMN "categoryId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP CONSTRAINT IF EXISTS "FK_clubs_categoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "categoryId"`,
    );
  }
}
