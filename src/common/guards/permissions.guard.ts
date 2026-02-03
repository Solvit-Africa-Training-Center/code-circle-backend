import { PermissionResolverService } from "@circle-backend/modules/auth/services/permission-resolver.service";
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { scopeInterface } from "@circle-backend/modules/auth/enums/scope.enum";
import { PermissionKey } from "@circle-backend/modules/auth/constants/permissions";
import { CurrentUserPayload } from "@circle-backend/modules/auth/strategies/jwt.strategy";


interface RequestWithUser extends Request {
  user: CurrentUserPayload;
  params?: Record<string, string>;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  private inferScope(req: RequestWithUser): scopeInterface {
    if (req.params?.clubId) {
      return scopeInterface.CLUB;
    }
    if (req.params?.organizationId) {
      return scopeInterface.GLOBAL;
    }
    return scopeInterface.GLOBAL;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const scope = this.inferScope(request);

    const userPermissions = await this.permissionResolver.resolveForUser(
      user.id,
      scope,
    );

    const missingPermissions = requiredPermissions.filter((perm) => {
      return ![...userPermissions].some(userPerm => {
        return (
          userPerm === '*' || 
          (userPerm.endsWith(':*') && perm.startsWith(userPerm.split(':')[0] + ':')) ||
          userPerm === perm
        );
      });
    });

    if (missingPermissions.length > 0) {
      this.logger.warn(
        `User ${user.id} missing permissions: ${missingPermissions.join(', ')}`,
      );

      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
