import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InstancesService } from './instances.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { ResponseInstanceDto } from './dto/response-instance.dto';

@Controller()
@ApiTags('instance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post('instance/create')
  @ApiOperation({ summary: 'Create a new WireGuard instance' })
  @ApiResponse({ status: 201, type: ResponseInstanceDto })
  @ApiResponse({ status: 400, description: 'Instance name already exists or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createInstanceDto: CreateInstanceDto): Promise<ResponseInstanceDto> {
    return this.instancesService.create(createInstanceDto);
  }

  @Get('instances')
  @ApiOperation({ summary: 'List all WireGuard instances' })
  @ApiResponse({ status: 200, type: [ResponseInstanceDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(): Promise<ResponseInstanceDto[]> {
    return this.instancesService.findAll();
  }

  @Delete('instance/delete')
  @ApiOperation({ summary: 'Delete a WireGuard instance by id' })
  @ApiResponse({ status: 200, description: 'Instance deleted' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Query('id') id: string) {
    return this.instancesService.remove(id);
  }
}
