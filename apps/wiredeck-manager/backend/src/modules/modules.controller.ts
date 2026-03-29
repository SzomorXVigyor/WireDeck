import { Body, Controller, Delete, Post, Put, Query } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateModuleWebvncDto } from './dto/create-module-webvnc.dto';
import { CreateModuleWebviewDto } from './dto/create-module-webview.dto';
import { UpdateModuleWebvncDto } from './dto/update-module-webvnc.dto';
import { UpdateModuleWebviewDto } from './dto/update-module-webview.dto';
import { ResponseModuleWebvncDto } from './dto/response-module-webvnc.dto';
import { ResponseModuleWebviewDto } from './dto/response-module-webview.dto';

@Controller('instance/module')
@ApiTags('instance/module')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post('create')
  async create(
    @Query('id') id: string,
    @Query('type') type: string,
    @Body() createModuleDto: CreateModuleWebvncDto | CreateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    return this.modulesService.create(id, type, createModuleDto);
  }

  @Put('update')
  async update(
    @Query('id') id: string,
    @Query('type') type: string,
    @Body() updateModuleDto: UpdateModuleWebvncDto | UpdateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    return this.modulesService.update(id, type, updateModuleDto);
  }

  @Delete('delete')
  async remove(@Query('id') id: string, @Query('type') type: string): Promise<void> {
    return this.modulesService.remove(id, type);
  }
}
