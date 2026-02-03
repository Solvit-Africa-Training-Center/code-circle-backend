import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentUserPayload } from '@circle-backend/modules/auth/strategies/jwt.strategy';

interface RequestWithUser extends Request {
  user: CurrentUserPayload;
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.roles) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userRoleNames = user.roles.map((r) => r.name);

    const hasRole = userRoleNames.some((role) => requiredRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `User ${user.id} missing required roles. Has: ${userRoleNames.join(', ')}, Required: ${requiredRoles.join(', ')}`,
      );

      throw new ForbiddenException(
        `Insufficient role. Required one of: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
