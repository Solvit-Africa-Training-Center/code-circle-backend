import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserAttachmentColumnsToText1762000000000
  implements MigrationInterface
{
  name = 'AlterUserAttachmentColumnsToText1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "cv" TYPE text USING "cv"::text',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "degree" TYPE text USING "degree"::text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "degree" TYPE character varying USING "degree"::character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "cv" TYPE character varying USING "cv"::character varying',
    );
  }
}
