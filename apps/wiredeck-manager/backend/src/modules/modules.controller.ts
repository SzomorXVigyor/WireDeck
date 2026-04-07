import { Body, Controller, Delete, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModulesService, ModuleType } from './modules.service';
import { CreateModuleWebvncDto } from './dto/create-module-webvnc.dto';
import { CreateModuleWebviewDto } from './dto/create-module-webview.dto';
import { UpdateModuleWebvncDto } from './dto/update-module-webvnc.dto';
import { UpdateModuleWebviewDto } from './dto/update-module-webview.dto';
import { ResponseModuleWebvncDto } from './dto/response-module-webvnc.dto';
import { ResponseModuleWebviewDto } from './dto/response-module-webview.dto';

@Controller('instance/module')
@ApiTags('instance/module')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a module (webvnc | webview) for an instance' })
  @ApiResponse({
    status: 201,
    description: 'Module created',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ResponseModuleWebvncDto' },
        { $ref: '#/components/schemas/ResponseModuleWebviewDto' },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Module already exists or unknown type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async create(
    @Query('id') instanceId: string,
    @Query('type') type: ModuleType,
    @Body() createModuleDto: CreateModuleWebvncDto | CreateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    return this.modulesService.create(instanceId, type, createModuleDto);
  }

  @Put('update')
  @ApiOperation({ summary: 'Update a module (webvnc | webview) for an instance' })
  @ApiResponse({
    status: 200,
    description: 'Module updated',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ResponseModuleWebvncDto' },
        { $ref: '#/components/schemas/ResponseModuleWebviewDto' },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Unknown module type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Module or instance not found' })
  async update(
    @Query('id') instanceId: string,
    @Query('type') type: ModuleType,
    @Body() updateModuleDto: UpdateModuleWebvncDto | UpdateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    return this.modulesService.update(instanceId, type, updateModuleDto);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete a module (webvnc | webview) for an instance' })
  @ApiResponse({ status: 200, description: 'Module deleted' })
  @ApiResponse({ status: 400, description: 'Unknown module type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Module or instance not found' })
  async remove(@Query('id') instanceId: string, @Query('type') type: ModuleType): Promise<void> {
    return this.modulesService.remove(instanceId, type);
  }
}
