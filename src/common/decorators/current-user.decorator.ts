import { CurrentUserPayload } from '@circle-backend/modules/auth/strategies/jwt.strategy';
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

//@CurresntUser() user: CurrentUserPayload//

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return request.user as CurrentUserPayload;
  },
);