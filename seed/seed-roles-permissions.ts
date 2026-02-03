import { NestFactory } from '@nestjs/core';
import { AppModule } from '@circle-backend/app.module';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Role } from '@circle-backend/modules/auth/entities/role.entity';
import { Permission } from '@circle-backend/modules/auth/entities/permission.entity';
import { getAllPermissions } from '@circle-backend/modules/auth/constants/permissions';
import { RolePermission } from '@circle-backend/modules/auth/entities/role-permission.entity';
import { UserRole } from '@circle-backend/modules/auth/entities/user-role.entity';
import { UserPermission } from '@circle-backend/modules/auth/entities/user-permission.entity';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { RefreshToken } from '@circle-backend/modules/auth/entities/refresh-token.entity';
import { EmailVerificationToken } from '@circle-backend/modules/auth/entities/email-verification-token.entity';
import { OAuthAccount } from '@circle-backend/modules/auth/entities/oauth-account.entity';
import { TwoFactorSecret } from '@circle-backend/modules/auth/entities/two-factor-secret';
import { PasswordResetToken } from '@circle-backend/modules/auth/entities/password-reset-token.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);

  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: Number(configService.get<number>('DB_PORT')) || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || '',
    database: configService.get<string>('DB_NAME') || 'code-circle',
    entities: [
      Role,
      Permission,
      RolePermission,
      UserRole,
      UserPermission,
      User,
      OAuthAccount,
      RefreshToken,
      EmailVerificationToken,
      TwoFactorSecret,
      PasswordResetToken,
    ],
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const roleRepo = dataSource.getRepository(Role);
    const permRepo = dataSource.getRepository(Permission);

    // Seed roles
    const roles = ['ADMIN', 'CLUB_LEADER', 'MEMBER'];
    for (const name of roles) {
      const exists = await roleRepo.findOne({ where: { name } });
      if (!exists) {
        await roleRepo.save(roleRepo.create({ name }));
        console.log(`Role created: ${name}`);
      }
    }

    // Seed permissions
    const permissions = getAllPermissions();
    for (const perm of permissions) {
      const exists = await permRepo.findOne({ where: { name: perm } });
      if (!exists) {
        await permRepo.save(permRepo.create({ name: perm }));
        console.log(`Permission created: ${perm}`);
      }
    }

    console.log('Seeding complete!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await dataSource.destroy();
    await app.close();
  }
}

void bootstrap();

//first run
//npm i tsconfig-paths -D
//npx ts-node -r tsconfig-paths/register seed/seed-roles-permissions.ts