// These imports are kept for future validation use
// import { Type } from 'class-transformer';
// import {
//   IsBoolean,
//   IsInt,
//   IsOptional,
//   IsString,
//   ValidateNested,
// } from 'class-validator';

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
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  voice: boolean;
  rcs: boolean;
  campaigns: boolean;
  analytics: boolean;
}

export interface AuthConfig {
  jwt: JwtConfig;
  bcrypt: BcryptConfig;
  apiKey: ApiKeyConfig;
  passwordPolicy: PasswordPolicyConfig;
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

export interface DatabaseConfig {
  postgres: PostgresConfig;
  clickhouse: ClickhouseConfig;
}

export interface PostgresConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  maxConnections: number;
  ssl: boolean;
}

export interface ClickhouseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  cacheTtl: number;
  sessionTimeout: number;
  maxRetriesPerRequest: number;
  maxSessionsPerUser: number;
  enableOfflineQueue: boolean;
  keyPrefix: string;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
  connectionTimeout: number;
  retries: number;
  topics: KafkaTopics;
}

export interface KafkaTopics {
  sms: string;
  whatsapp: string;
  email: string;
  voice: string;
  rcs: string;
  messageSent: string;
  messageFailed: string;
}

export interface Config {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  kafka: KafkaConfig;
}

// Type-safe configuration keys
export type ConfigKey = keyof Config;
export type AppConfigKey = keyof AppConfig;
export type AuthConfigKey = keyof AuthConfig;
export type DatabaseConfigKey = keyof DatabaseConfig;
export type RedisConfigKey = keyof RedisConfig;
export type KafkaConfigKey = keyof KafkaConfig;

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
  | `database.postgres.${keyof PostgresConfig}`
  | `database.clickhouse.${keyof ClickhouseConfig}`
  | `redis.${keyof RedisConfig}`
  | `kafka.${keyof KafkaConfig}`
  | `kafka.topics.${keyof KafkaTopics}`;
