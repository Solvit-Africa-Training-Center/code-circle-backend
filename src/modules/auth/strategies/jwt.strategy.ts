import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@circle-backend/modules/users/entities/user.entity';
import { scopeInterface } from '../enums/scope.enum';

export interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface CurrentUserPayload {
  id: string;
  email: string;
  roles: {
    name: string;
    scope: scopeInterface;
  }[];
  permissions: string[]
}



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
      relations: [
        'userRoles',
        'userRoles.role',
        'userRoles.role.rolePermissions',
        'userRoles.role.rolePermissions.permission',
        'userPermissions',
        'userPermissions.permission',
      ],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userRoles = user.userRoles ?? [];
    const userPermissions = user.userPermissions ?? [];

    const rolePermissions = userRoles
      .flatMap((ur) => ur.role.rolePermissions || [])
      .map((rp) => rp.permission.name);

    const directPermissions = userPermissions
      .filter((up) => !up.isDenied && (!up.expiresAt || up.expiresAt > new Date()))
      .map((up) => up.permission.name);

    const deniedPermissions = new Set(
      userPermissions
        .filter((up) => up.isDenied && (!up.expiresAt || up.expiresAt > new Date()))
        .map((up) => up.permission.name),
    );

    const allPermissions = [...new Set([...rolePermissions, ...directPermissions])].filter(
      (perm) => !deniedPermissions.has(perm),
    );

    return {
      id: user.id,
      email: user.email,
      roles: userRoles.map(ur => ({
        name: ur.role.name,
        scope: ur.role.scope,
      })),
      permissions: allPermissions,
    };
  }

}