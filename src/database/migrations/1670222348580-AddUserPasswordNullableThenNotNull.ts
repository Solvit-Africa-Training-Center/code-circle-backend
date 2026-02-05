module.exports = class AddUserPasswordNullableThenNotNull1670222348580 {
    async up(queryRunner) {
        // 1. Add the column as nullable
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "password" text`);
        // 2. Backfill with a default value for existing users
        await queryRunner.query(`UPDATE "users" SET "password" = '' WHERE "password" IS NULL`);
        // 3. Alter the column to be NOT NULL
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
    }
    async down(queryRunner) {
        // Remove the column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    }
}
