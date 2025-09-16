export interface AuthPayload {
  sub: string; // user ID
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

// Legacy alias for backward compatibility
export type UserPayload = AuthPayload;
export type JwtPayload = AuthPayload;
