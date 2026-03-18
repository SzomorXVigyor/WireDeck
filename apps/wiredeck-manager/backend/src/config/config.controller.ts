import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigResponseDto } from './dto/config-response.dto';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Get runtime feature flags and configuration for the frontend' })
  @ApiResponse({ status: 200, description: 'Current feature configuration', type: ConfigResponseDto })
  getConfig(): ConfigResponseDto {
    return new ConfigResponseDto();
  }
}
