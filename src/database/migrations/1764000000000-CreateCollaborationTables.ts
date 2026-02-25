import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollaborationTables1764000000000 implements MigrationInterface {
  name = 'CreateCollaborationTables1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."collaboration_tasks_status_enum" AS ENUM('todo', 'in_progress', 'review', 'done');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collaboration_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clubId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collaboration_messages_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collaboration_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clubId" uuid NOT NULL,
        "createdBy" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "status" "public"."collaboration_tasks_status_enum" NOT NULL DEFAULT 'todo',
        "dueDate" TIMESTAMP NULL,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collaboration_tasks_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collaboration_code_submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clubId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "language" character varying(30) NOT NULL,
        "code" text NOT NULL,
        "note" text NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collaboration_code_submissions_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "collaboration_messages"
      ADD CONSTRAINT "FK_collaboration_messages_clubId"
      FOREIGN KEY ("clubId") REFERENCES "clubs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_messages"
      ADD CONSTRAINT "FK_collaboration_messages_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "collaboration_tasks"
      ADD CONSTRAINT "FK_collaboration_tasks_clubId"
      FOREIGN KEY ("clubId") REFERENCES "clubs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_tasks"
      ADD CONSTRAINT "FK_collaboration_tasks_createdBy"
      FOREIGN KEY ("createdBy") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "collaboration_code_submissions"
      ADD CONSTRAINT "FK_collaboration_code_submissions_clubId"
      FOREIGN KEY ("clubId") REFERENCES "clubs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_code_submissions"
      ADD CONSTRAINT "FK_collaboration_code_submissions_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaboration_code_submissions"
      DROP CONSTRAINT IF EXISTS "FK_collaboration_code_submissions_userId";
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_code_submissions"
      DROP CONSTRAINT IF EXISTS "FK_collaboration_code_submissions_clubId";
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_tasks"
      DROP CONSTRAINT IF EXISTS "FK_collaboration_tasks_createdBy";
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_tasks"
      DROP CONSTRAINT IF EXISTS "FK_collaboration_tasks_clubId";
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_messages"
      DROP CONSTRAINT IF EXISTS "FK_collaboration_messages_userId";
    `);
    await queryRunner.query(`
      ALTER TABLE "collaboration_messages"
      DROP CONSTRAINT IF EXISTS "FK_collaboration_messages_clubId";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "collaboration_code_submissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "collaboration_tasks";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "collaboration_messages";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."collaboration_tasks_status_enum";`);
  }
}

