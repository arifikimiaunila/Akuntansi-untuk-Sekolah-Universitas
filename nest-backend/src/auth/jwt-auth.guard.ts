import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET || 'dev-secret-akuntansi';

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token tidak valid');
    }
  }
}
