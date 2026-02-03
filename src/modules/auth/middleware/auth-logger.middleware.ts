import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthLoggerMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith('/auth')) {
      this.logger.log(`[${req.method}] ${req.path} called`);
    }
    next();
  }
}