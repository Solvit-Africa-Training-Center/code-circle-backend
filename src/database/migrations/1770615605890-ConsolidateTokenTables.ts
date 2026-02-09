import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class ConsolidateTokenTables1770615605890 implements MigrationInterface {
  name = 'ConsolidateTokenTables1770615605890';

    public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Check if auth_tokens table already exists
    const authTokensTable = await queryRunner.getTable('auth_tokens');
    
    if (authTokensTable) {
      console.log('auth_tokens table already exists, skipping creation');
      return; // Table already exists, skip migration
    }

    // Step 2: Create the enum type for token types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "auth_token_type_enum" AS ENUM ('email_verification', 'password_reset', 'refresh', 'revoked', 'two_factor_backup');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Step 3: Create the new auth_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'auth_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true, // Can be null for REVOKED JWT tokens
          },
          {
            name: 'type',
            type: 'auth_token_type_enum',
            isNullable: false,
          },
          {
            name: 'token_hash',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'device_info',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes (with existence checks using IF NOT EXISTS)
    const indexes = [
      { name: 'IDX_auth_tokens_token_hash', columns: ['token_hash'], unique: true },
      { name: 'IDX_auth_tokens_expires_at', columns: ['expires_at'], unique: false },
      { name: 'IDX_auth_tokens_user_type', columns: ['user_id', 'type'], unique: false },
      { name: 'IDX_auth_tokens_type_used', columns: ['type', 'used'], unique: false },
      { name: 'IDX_auth_tokens_type_revoked', columns: ['type', 'is_revoked'], unique: false },
    ];

    for (const indexDef of indexes) {
      try {
        if (indexDef.unique) {
          await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "${indexDef.name}" 
            ON "auth_tokens" (${indexDef.columns.map(col => `"${col}"`).join(', ')})
          `);
        } else {
          await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "${indexDef.name}" 
            ON "auth_tokens" (${indexDef.columns.map(col => `"${col}"`).join(', ')})
          `);
        }
      } catch (error: any) {
        // If index already exists, log and continue
        if (error.code === '42P07' || error.message?.includes('already exists')) {
          console.log(`Index ${indexDef.name} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    // Create foreign key
    await queryRunner.createForeignKey(
      'auth_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Step 2: Migrate data from old tables to new table
    // Check if old tables exist before migrating
    const emailVerificationTable = await queryRunner.getTable('email_verification_tokens');
    const passwordResetTable = await queryRunner.getTable('password_reset_tokens');
    const refreshTokenTable = await queryRunner.getTable('refresh_tokens');
    const revokedTokenTable = await queryRunner.getTable('revoked_tokens');

    // Migrate email_verification_tokens
    if (emailVerificationTable) {
      await queryRunner.query(`
        INSERT INTO auth_tokens (
          id, user_id, type, token_hash, expires_at, used, used_at, created_at, updated_at
        )
        SELECT 
          id, user_id, 'email_verification'::auth_token_type_enum, token_hash, expires_at, used, used_at, created_at, updated_at
        FROM email_verification_tokens
      `);
    }

    // Migrate password_reset_tokens
    if (passwordResetTable) {
      await queryRunner.query(`
        INSERT INTO auth_tokens (
          id, user_id, type, token_hash, expires_at, used, used_at, created_at, updated_at
        )
        SELECT 
          id, user_id, 'password_reset'::auth_token_type_enum, token_hash, expires_at, used, used_at, created_at, updated_at
        FROM password_reset_tokens
      `);
    }

    // Migrate refresh_tokens
    if (refreshTokenTable) {
      await queryRunner.query(`
        INSERT INTO auth_tokens (
          id, user_id, type, token_hash, expires_at, is_revoked, revoked_at, device_info, ip_address, created_at, updated_at
        )
        SELECT 
          id, user_id, 'refresh'::auth_token_type_enum, token_hash, expires_at, is_revoked, revoked_at, device_info, ip_address, created_at, updated_at
        FROM refresh_tokens
      `);
    }

    // Migrate revoked_tokens (JWT tokens)
    // Note: revoked_tokens table has 'token' column, not 'token_hash', and 'expires_in' not 'expires_at'
    if (revokedTokenTable) {
      // First check the structure of revoked_tokens
      const revokedTableColumns = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'revoked_tokens'
      `);
      
      const hasTokenHash = revokedTableColumns.some((col: any) => col.column_name === 'token_hash');
      const hasExpiresAt = revokedTableColumns.some((col: any) => col.column_name === 'expires_at');
      
      if (hasTokenHash && hasExpiresAt) {
        await queryRunner.query(`
          INSERT INTO auth_tokens (
            id, type, token_hash, expires_at, is_revoked, revoked_at, created_at, updated_at
          )
          SELECT 
            id, 'revoked'::auth_token_type_enum, token_hash, expires_at, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          FROM revoked_tokens
        `);
      } else {
        // Handle old structure with 'token' and 'expires_in'
        await queryRunner.query(`
          INSERT INTO auth_tokens (
            id, type, token_hash, expires_at, is_revoked, revoked_at, created_at, updated_at
          )
          SELECT 
            id, 'revoked'::auth_token_type_enum, 
            encode(digest(token, 'sha256'), 'hex') as token_hash,
            expires_in as expires_at,
            true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          FROM revoked_tokens
        `);
      }
    }

    // Step 3: Drop old tables (if they exist)
    if (emailVerificationTable) {
      await queryRunner.dropTable('email_verification_tokens');
    }

    if (passwordResetTable) {
      await queryRunner.dropTable('password_reset_tokens');
    }

    if (refreshTokenTable) {
      await queryRunner.dropTable('refresh_tokens');
    }

    if (revokedTokenTable) {
      await queryRunner.dropTable('revoked_tokens');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Drop the new table and enum type
    // Note: Data migration back to old tables is not implemented
    // In production, you'd want to properly restore the old tables with data
    
    await queryRunner.dropTable('auth_tokens');
    
    // Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "auth_token_type_enum"`);
    
    // Note: The old tables would need to be recreated with their original structure
    // This is a simplified rollback - in production, you'd want to restore the exact schema
  }
}
