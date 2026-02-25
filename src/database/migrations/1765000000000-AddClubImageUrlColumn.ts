import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClubImageUrlColumn1765000000000 implements MigrationInterface {
  name = 'AddClubImageUrlColumn1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clubs"
      ADD COLUMN IF NOT EXISTS "imageUrl" text NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clubs"
      DROP COLUMN IF EXISTS "imageUrl";
    `);
  }
}
