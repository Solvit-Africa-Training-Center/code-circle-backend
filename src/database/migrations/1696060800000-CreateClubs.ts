import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateClubs1696060800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'clubs',
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
            name: 'isPublic',
            type: 'boolean',
            isNullable: false,
            default: 'true',
          },
          {
            name: 'ownerId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'clubs',
      new TableIndex({
        name: 'IDX_clubs_name_unique',
        columnNames: ['name'],
        isUnique: true,
      }),
    );

    // NOTE: ownerId FK relation to users table is intentionally omitted here
    // because the `users` entity/schema may not yet be present in every DB.
    // If you want a strict FK, add the following (uncomment) after confirming
    // the `users` table exists:
    // await queryRunner.createForeignKey('clubs', new TableForeignKey({
    //   columnNames: ['ownerId'],
    //   referencedTableName: 'users',
    //   referencedColumnNames: ['id'],
    //   onDelete: 'SET NULL',
    // }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('clubs', 'IDX_clubs_name_unique');
    await queryRunner.dropTable('clubs', true);
  }
}
