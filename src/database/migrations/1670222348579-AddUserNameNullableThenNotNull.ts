module.exports = class AddUserNameNullableThenNotNull1670222348579 {
    async up(queryRunner) {
        // 1. Add the column as nullable
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "name" character varying`);
        // 2. Backfill with a default value for existing users
        await queryRunner.query(`UPDATE "users" SET "name" = 'Unknown' WHERE "name" IS NULL`);
        // 3. Alter the column to be NOT NULL
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL`);
    }
    async down(queryRunner) {
        // Remove the column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    }
}
