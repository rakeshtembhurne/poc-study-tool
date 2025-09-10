import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  Config,
  ConfigPath,
  AppConfig,
  DatabaseConfig,
} from './interfaces/config.interface';
import { AuthConfig, JwtConfig } from './interfaces/auth.config';

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends keyof T[K]
      ? T[K][Rest]
      : PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  getJwtConfig(): JwtConfig {
    const auth = this.getOrThrow('auth');
    return auth.jwt;
  }

  /**
   * Get a configuration value with type safety
   * @param key The configuration path (e.g., 'app.port', 'redis.host')
   * @returns The configuration value or undefined
   */
  get<K extends ConfigPath>(key: K): PathValue<Config, K> | undefined {
    return this.configService.get<PathValue<Config, K>>(key);
  }

  /**
   * Get a configuration value or throw if not found
   * @param key The configuration path
   * @returns The configuration value
   * @throws If the configuration value is not found
   */
  getOrThrow<K extends ConfigPath>(key: K): PathValue<Config, K> {
    return this.configService.getOrThrow<PathValue<Config, K>>(key);
  }

  /**
   * Get the complete app configuration
   */
  getAppConfig(): AppConfig {
    return this.configService.getOrThrow('app');
  }

  /**
   * Get the complete auth configuration
   */
  getAuthConfig(): AuthConfig {
    return this.configService.getOrThrow('auth');
  }

  /**
   * Get the complete database configuration
   */
  getDatabaseConfig(): DatabaseConfig {
    return this.configService.getOrThrow('database');
  }

  get isDevelopment(): boolean {
    return this.getOrThrow('app.env') === 'development';
  }

  get isProduction(): boolean {
    return this.getOrThrow('app.env') === 'production';
  }

  get isTest(): boolean {
    return this.getOrThrow('app.env') === 'test';
  }

  /**
   * Check if a specific module is enabled
   */
  isModuleEnabled(module: keyof AppConfig['modules']): boolean {
    return this.getOrThrow(`app.modules.${module}` as ConfigPath) === true;
  }
}
