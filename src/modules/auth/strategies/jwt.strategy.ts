import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  GlobalStatus,
} from '@circle-backend/modules/users/entities/user.entity';
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
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const jwtFromRequest: JwtFromRequestFunction = ExtractJwt.fromExtractors([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req: {
        headers: {
          authorization: string | undefined;
          Authorization: string | undefined;
        };
      }) => {
        const authHeader =
          req?.headers?.authorization ?? req?.headers?.Authorization;
        if (!authHeader) {
          return null;
        }
        const parts = authHeader.split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
          return parts[1] ?? null;
        }
        return authHeader;
      },
      // Cookie-based auth
      (req: { cookies: Record<string, string> | undefined }) =>
        req?.cookies?.access_token ?? null,
      // Custom header
      (req: { headers: { [x: string]: string | undefined } }) =>
        req?.headers?.['x-access-token'] ?? null,
      // Query param
      (req: { query: { access_token: string | undefined } }) =>
        req?.query?.access_token ?? null,
    ]) as JwtFromRequestFunction;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub, globalStatus: GlobalStatus.ACTIVE },
      relations: [
        'userRoles',
        'userRoles.role',
        'userRoles.role.rolePermissions',
        'userRoles.role.rolePermissions.permission',
        'userPermissions',
        'userPermissions.permission',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or not active');
    }

    const userRoles = user.userRoles ?? [];
    const userPermissions = user.userPermissions ?? [];

    const rolePermissions = userRoles
      .flatMap((ur) => ur.role.rolePermissions || [])
      .map((rp) => rp.permission.name);

    const directPermissions = userPermissions
      .filter(
        (up) => !up.isDenied && (!up.expiresAt || up.expiresAt > new Date()),
      )
      .map((up) => up.permission.name);

    const deniedPermissions = new Set(
      userPermissions
        .filter(
          (up) => up.isDenied && (!up.expiresAt || up.expiresAt > new Date()),
        )
        .map((up) => up.permission.name),
    );

    const allPermissions = [
      ...new Set([...rolePermissions, ...directPermissions]),
    ].filter((perm) => !deniedPermissions.has(perm));

    return {
      id: user.id,
      email: user.email,
      roles: userRoles.map((ur) => ({
        name: ur.role.name,
        scope: ur.role.scope,
      })),
      permissions: allPermissions,
    };
  }
}
