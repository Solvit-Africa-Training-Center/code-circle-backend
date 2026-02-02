import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  isAuthCandidate?: boolean;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthMiddleware');

  use(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      this.logger.warn(`Unauthorized access attempt to ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    req.headers['authorization'] = authHeader.trim();
    req.isAuthCandidate = true; 

    this.logger.log(`AuthMiddleware passed for ${req.method} ${req.originalUrl}`);
    next();
  }
}