import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { AuthUser } from './auth.types';

export class LoginDto {
  username!: string;
  password!: string;
}

interface UserRecord extends AuthUser {
  password: string;
}

@Injectable()
export class AuthService {
  private readonly users: UserRecord[] = [
    {
      username: 'admin',
      password: 'admin123',
      nama: 'Admin Yayasan',
      role: 'ADMIN_YAYASAN',
    },
    {
      username: 'bendahara',
      password: 'bendahara123',
      nama: 'Bendahara Unit',
      role: 'BENDAHARA_UNIT',
    },
    {
      username: 'operator',
      password: 'operator123',
      nama: 'Operator Kampus',
      role: 'OPERATOR_KAMPUS',
    },
  ];

  login(dto: LoginDto) {
    const username = (dto.username || '').trim();
    const password = (dto.password || '').trim();

    const user = this.users.find((u) => u.username === username && u.password === password);
    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const payload: AuthUser = {
      username: user.username,
      nama: user.nama,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET || 'dev-secret-akuntansi';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '12h') as SignOptions['expiresIn'];
    const token = jwt.sign(payload, secret, { expiresIn });

    return {
      token,
      profile: payload,
      expires_in: expiresIn,
    };
  }
}
