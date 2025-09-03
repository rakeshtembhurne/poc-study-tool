import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  validateSync,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

/**
 * Environment variables validation schema
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  APP_NAME: string = 'Pyramid 2.0 Backend';

  @IsString()
  APP_VERSION: string = '0.1.0';

  @IsString()
  API_PREFIX: string = 'api/v1';

  @IsOptional()
  @Transform(({ value }) => (value as string)?.split(',') || [])
  ALLOWED_ORIGINS?: string[];

  // Database Configuration
  @IsString()
  POSTGRES_HOST: string = 'localhost';

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT: number = 5432;

  @IsString()
  POSTGRES_USER: string = 'pyramid';

  @IsString()
  POSTGRES_PASSWORD: string = 'pyramid123';

  @IsString()
  POSTGRES_DB: string = 'pyramid_db';

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  POSTGRES_SSL?: boolean;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  POSTGRES_MAX_CONNECTIONS?: number = 100;

  // Redis Configuration
  @IsString()
  REDIS_HOST: string = 'localhost';

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB?: number = 0;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  REDIS_CACHE_TTL?: number = 300;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(60)
  @IsOptional()
  SESSION_TIMEOUT?: number = 3600;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  MAX_SESSIONS_PER_USER?: number = 5;

  // Kafka Configuration
  @Transform(
    ({ value }) =>
      (value as string | undefined)?.split(',') || ['localhost:9092'],
  )
  KAFKA_BROKERS: string[] = ['localhost:9092'];

  @IsString()
  @IsOptional()
  KAFKA_CLIENT_ID?: string = 'pyramid-backend';

  @IsString()
  @IsOptional()
  KAFKA_GROUP_ID?: string = 'pyramid-group';

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(100)
  @Max(60000)
  @IsOptional()
  KAFKA_CONNECTION_TIMEOUT?: number = 3000;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  KAFKA_RETRIES?: number = 5;

  // JWT Configuration
  @IsString()
  JWT_SECRET: string = 'your-super-secret-key-change-in-production';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRY?: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRY?: string = '7d';

  // Module Feature Flags
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MODULES_SMS_ENABLED?: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MODULES_WHATSAPP_ENABLED?: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MODULES_EMAIL_ENABLED?: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MODULES_VOICE_ENABLED?: boolean = false;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MODULES_RCS_ENABLED?: boolean = false;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MODULES_CAMPAIGNS_ENABLED?: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MODULES_ANALYTICS_ENABLED?: boolean = true;

  // ClickHouse Configuration
  @IsString()
  @IsOptional()
  CLICKHOUSE_HOST?: string = 'localhost';

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  CLICKHOUSE_PORT?: number = 8123;

  @IsString()
  @IsOptional()
  CLICKHOUSE_DB?: string = 'pyramid_analytics';

  @IsString()
  @IsOptional()
  CLICKHOUSE_USER?: string = 'default';

  @IsString()
  @IsOptional()
  CLICKHOUSE_PASSWORD?: string = '';

  // Password Policy
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(6)
  @IsOptional()
  PASSWORD_MIN_LENGTH?: number = 8;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  PASSWORD_REQUIRE_UPPERCASE?: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  PASSWORD_REQUIRE_LOWERCASE?: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  PASSWORD_REQUIRE_NUMBERS?: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  PASSWORD_REQUIRE_SPECIAL_CHARS?: boolean = true;

  // Bcrypt Configuration
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(4)
  @Max(31)
  @IsOptional()
  BCRYPT_ROUNDS?: number = 10;

  // API Key Configuration
  @IsString()
  @IsOptional()
  API_KEY_HEADER?: string = 'x-api-key';
}

/**
 * Validate environment variables
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints || {};
        return `${error.property}: ${Object.values(constraints).join(', ')}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}

/**
 * Get validated environment configuration
 */
export function getValidatedEnvConfig(): EnvironmentVariables {
  return validate(process.env);
}
