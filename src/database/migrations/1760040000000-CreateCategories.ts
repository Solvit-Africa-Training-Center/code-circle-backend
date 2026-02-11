import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCategories1760040000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image',
            type: 'varchar',
            length: '1024',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_name_unique" ON "categories" ("name")`,
    );

    await queryRunner.query(`
      INSERT INTO "categories" ("name")
      VALUES
        ('datascience'),
        ('ai'),
        ('cybersecurity'),
        ('frontend'),
        ('backend'),
        ('uiux')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('categories', 'IDX_categories_name_unique');
    await queryRunner.dropTable('categories', true);
  }
}
