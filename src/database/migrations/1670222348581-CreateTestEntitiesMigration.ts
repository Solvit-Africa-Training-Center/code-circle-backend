module.exports = class CreateTestEntitiesMigration1670222348581 {
    async up(queryRunner) {
        // Categories
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "categories" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "name" varchar UNIQUE NOT NULL,
            "slug" varchar UNIQUE NOT NULL,
            "description" text,
            "icon" text,
            "isActive" boolean DEFAULT true,
            "created_at" TIMESTAMP DEFAULT now(),
            "updated_at" TIMESTAMP DEFAULT now()
        )`);

        // Tests
        await queryRunner.query(`CREATE TYPE test_type_enum AS ENUM ('CREATOR_TEST', 'MEMBER_TEST')`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tests" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "categoryId" uuid NOT NULL REFERENCES categories(id),
            "type" test_type_enum NOT NULL,
            "clubId" uuid,
            "difficulty" varchar,
            "passingScore" integer DEFAULT 60,
            "createdById" uuid REFERENCES users(id),
            "isActive" boolean DEFAULT true,
            "created_at" TIMESTAMP DEFAULT now(),
            "updated_at" TIMESTAMP DEFAULT now()
        )`);

        // TestQuestions
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "test_questions" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "testId" uuid NOT NULL REFERENCES tests(id),
            "question" text NOT NULL,
            "options" json,
            "correctAnswer" text,
            "points" integer DEFAULT 1,
            "orderIndex" integer DEFAULT 0,
            "created_at" TIMESTAMP DEFAULT now(),
            "updated_at" TIMESTAMP DEFAULT now()
        )`);

        // TestAttempts
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "test_attempts" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "userId" uuid NOT NULL REFERENCES users(id),
            "testId" uuid NOT NULL REFERENCES tests(id),
            "clubId" uuid,
            "score" integer DEFAULT 0,
            "passed" boolean DEFAULT false,
            "correctedByAI" boolean DEFAULT false,
            "answers" json,
            "feedback" text,
            "attempted_at" TIMESTAMP DEFAULT now(),
            "completed_at" TIMESTAMP,
            "updated_at" TIMESTAMP DEFAULT now()
        )`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "test_attempts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "test_questions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tests"`);
        await queryRunner.query(`DROP TYPE IF EXISTS test_type_enum`);
        await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    }
}
