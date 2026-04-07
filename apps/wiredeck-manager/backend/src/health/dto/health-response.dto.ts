import { ApiProperty } from '@nestjs/swagger';

export class HealthEnvironmentDto {
  @ApiProperty({ example: 2, description: 'Number of configured users' })
  users: number;
}

/** Response body for GET /api/health */
export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2026-03-07T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ type: HealthEnvironmentDto })
  environment: HealthEnvironmentDto;
}
