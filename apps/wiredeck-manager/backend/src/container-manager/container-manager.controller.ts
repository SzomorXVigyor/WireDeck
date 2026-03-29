import { Controller, Get, NotImplementedException, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContainerManagerService } from './container-manager.service';
import { DockerStatusDto } from './dto/docker-status.dto';

@ApiTags('docker')
@Controller('docker')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContainerManagerController {
  constructor(private readonly containerManagerService: ContainerManagerService) {}

  // Status

  @Get('status')
  @ApiOperation({ summary: 'Get Docker daemon status and container statistics' })
  @ApiResponse({ status: 200, type: DockerStatusDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(): Promise<DockerStatusDto> {
    return this.containerManagerService.getDockerStatus();
  }

  // Gateway

  @Post('reload-gateway')
  @ApiOperation({ summary: 'Reload the application gateway proxy' })
  @ApiResponse({ status: 200, description: 'Gateway reload triggered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reloadGateway(): Promise<void> {
    throw new NotImplementedException();
  }
}
