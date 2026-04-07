import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';
import { USERS } from '../utils/env';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Get service health status including WireGuard connection state' })
  @ApiResponse({ status: 200, description: 'Service is healthy', type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        users: (USERS as unknown[]).length,
      },
    };
  }
}
