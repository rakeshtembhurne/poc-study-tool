export interface AppConfig {
  env: string;
  port: number;
  name: string;
  version: string;
  apiPrefix: string;
  corsOrigins: string[];
  modules: ModuleConfig;
}

export interface ModuleConfig {
  ai: boolean;
  fileProcessing: boolean;
  analytics: boolean;
}

export interface JwtConfig {
  secret: string;
  accessExpiry: string;
  refreshExpiry: string;
}

export interface BcryptConfig {
  rounds: number;
}

export interface ApiKeyConfig {
  header: string;
}

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface AuthConfig {
  jwt: JwtConfig;
  bcrypt: BcryptConfig;
  apiKey: ApiKeyConfig;
  passwordPolicy: PasswordPolicyConfig;
}

export interface DatabaseConfig {
  url: string;
  directUrl?: string;
  maxConnections: number;
  ssl: boolean;
}

export interface Config {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
}

// Type-safe configuration keys
export type ConfigKey = keyof Config;
export type AppConfigKey = keyof AppConfig;
export type AuthConfigKey = keyof AuthConfig;
export type DatabaseConfigKey = keyof DatabaseConfig;

// Utility type for nested config paths
export type ConfigPath =
  | keyof Config
  | `app.${keyof AppConfig}`
  | `app.modules.${keyof ModuleConfig}`
  | `auth.${keyof AuthConfig}`
  | `auth.jwt.${keyof JwtConfig}`
  | `auth.bcrypt.${keyof BcryptConfig}`
  | `auth.apiKey.${keyof ApiKeyConfig}`
  | `auth.passwordPolicy.${keyof PasswordPolicyConfig}`
  | `database.${keyof DatabaseConfig}`;
