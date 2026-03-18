// apps/webvnc/backend/src/config/config.validation.ts
import { plainToClass, Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, validateSync } from 'class-validator';
import { UserEntity } from 'src/users/entities/user.entity';

class EnvironmentVariables {
  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  USERS: UserEntity[];

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
