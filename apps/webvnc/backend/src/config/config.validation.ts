// apps/webvnc/backend/src/config/config.validation.ts
import { plainToClass, Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, validateSync, IsBoolean } from 'class-validator';

class VncTarget {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ip: string;

  @IsNumber()
  port: number;

  @IsOptional()
  @IsString()
  password?: string;
}

class User {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  changeToken?: string;
}

class EnvironmentVariables {
  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  VNC_TARGETS: VncTarget[];

  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  USERS: User[];

  @IsString()
  WIREGUARD_CONF_STR: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  WIREDECK_SLAVE?: boolean;

  @IsOptional()
  @IsString()
  PASS_CHANGE_URL?: string;

  @IsOptional()
  @IsString()
  SERVICE_NAME?: string;
}

export function configValidation(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
