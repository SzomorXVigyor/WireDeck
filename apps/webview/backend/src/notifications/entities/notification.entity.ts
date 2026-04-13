import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ConditionOperator, NotificationMode } from '@prisma/client';

/**
 * Full notification entity (all fields).
 * DTOs are derived from this class using NestJS mapped-types.
 */
export class NotificationEntity {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Temperature alert' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'ID of the register to monitor' })
  @IsInt()
  registerId: number;

  @ApiProperty({ enum: ConditionOperator, example: 'gt', description: 'Comparison operator' })
  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @ApiProperty({ example: 100, description: 'Threshold / comparison constant' })
  @IsNumber()
  conditionValue: number;

  @ApiProperty({ enum: NotificationMode, example: 'immediate', description: 'Notification dispatch mode' })
  @IsEnum(NotificationMode)
  mode: NotificationMode;

  @ApiProperty({ example: 300, description: 'Re-check delay in seconds (used when mode = delayed)' })
  @IsInt()
  @Min(0)
  delaySeconds: number;

  @ApiProperty({ example: 'admin@example.com, ops@example.com', description: 'Comma-separated email addresses' })
  @IsString()
  @IsNotEmpty()
  recipients: string;

  @ApiProperty({ example: 'System Alert', description: 'Email subject line' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Register value is #REG at #TIME.', description: 'Email body (supports template syntax)' })
  @IsString()
  body: string;
}
