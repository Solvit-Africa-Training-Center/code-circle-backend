import { NestFactory } from '@nestjs/core';
import { AppModule } from '@circle-backend/app.module';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { Role } from '@circle-backend/modules/auth/entities/role.entity';
import { Permission } from '@circle-backend/modules/auth/entities/permission.entity';
import { RolePermission } from '@circle-backend/modules/auth/entities/role-permission.entity';
import { UserRole } from '@circle-backend/modules/auth/entities/user-role.entity';
import { UserPermission } from '@circle-backend/modules/auth/entities/user-permission.entity';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { AuthToken } from '@circle-backend/modules/auth/entities/auth-token.entity';
import { OAuthAccount } from '@circle-backend/modules/auth/entities/oauth-account.entity';

import {
  PERMISSIONS,
  PermissionKey,
  getAllPermissions,
} from '@circle-backend/modules/auth/constants/permissions';

const ROLE_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  ADMIN: Object.values(PERMISSIONS),

  CREATOR: [
    // club
    PERMISSIONS.CLUB_CREATE,
    PERMISSIONS.CLUB_READ,
    PERMISSIONS.CLUB_UPDATE,
    PERMISSIONS.CLUB_DELETE,

    // course
    PERMISSIONS.COURSE_OTHER,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.COURSE_DELETE,

    // member
    PERMISSIONS.MEMBER,
  ],

  MEMBER: [
    PERMISSIONS.MEMBER,
  ],
};

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
      AuthToken,
      OAuthAccount,
    ],
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const roleRepo = dataSource.getRepository(Role);
    const permRepo = dataSource.getRepository(Permission);
    const rolePermissionRepo =
      dataSource.getRepository(RolePermission);


    // await rolePermissionRepo.clear(); 
    // //await userRoleRepo.clear();       
    // await roleRepo.clear();
    // --------------------
    // Seed roles
    // --------------------
    const roles = ['ADMIN', 'CREATOR', 'MEMBER'];

    for (const name of roles) {
      const exists = await roleRepo.findOne({ where: { name } });

      if (!exists) {
        await roleRepo.save(roleRepo.create({ name }));
        console.log(`Role created: ${name}`);
      }
    }

    // --------------------
    // Seed permissions
    // --------------------
    const permissions = getAllPermissions();

    for (const perm of permissions) {
      const exists = await permRepo.findOne({
        where: { name: perm },
      });

      if (!exists) {
        await permRepo.save(
          permRepo.create({ name: perm }),
        );
        console.log(`Permission created: ${perm}`);
      }
    }

    // --------------------
    // Assign permissions to roles
    // --------------------
    for (const roleName of Object.keys(ROLE_PERMISSION_MAP)) {

      const role = await roleRepo.findOne({
        where: { name: roleName },
      });

      if (!role) continue;

      const permissionNames =
        ROLE_PERMISSION_MAP[roleName];

      for (const permName of permissionNames) {

        const permission = await permRepo.findOne({
          where: { name: permName },
        });

        if (!permission) continue;

        const exists = await rolePermissionRepo.findOne({
          where: {
            role: { id: role.id },
            permission: { id: permission.id },
          },
          relations: ['role', 'permission'],
        });

        if (!exists) {
          await rolePermissionRepo.save(
            rolePermissionRepo.create({
              role,
              permission,
            }),
          );

          console.log(
            `Assigned ${permName} -> ${roleName}`,
          );
        }
      }
    }

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await dataSource.destroy();
    await app.close();
  }
}

void bootstrap();
