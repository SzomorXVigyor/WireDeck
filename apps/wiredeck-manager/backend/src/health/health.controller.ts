import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get service health status including WireGuard connection state' })
  @ApiResponse({ status: 200, description: 'Service is healthy', type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    const users = this.configService.get('USERS') || [];

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        users: users.length,
      },
    };
  }
}
