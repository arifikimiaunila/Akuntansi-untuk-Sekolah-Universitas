export type UserRole = 'ADMIN_YAYASAN' | 'BENDAHARA_UNIT' | 'OPERATOR_KAMPUS';

export interface AuthUser {
  username: string;
  nama: string;
  role: UserRole;
}

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
}
