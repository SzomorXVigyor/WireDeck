import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateModuleWebvncDto } from './dto/create-module-webvnc.dto';
import { CreateModuleWebviewDto } from './dto/create-module-webview.dto';
import { UpdateModuleWebvncDto } from './dto/update-module-webvnc.dto';
import { UpdateModuleWebviewDto } from './dto/update-module-webview.dto';

@Controller('instance/module')
@ApiTags('instance/module')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post('create')
  create(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() createModuleDto: CreateModuleWebvncDto | CreateModuleWebviewDto
  ) {
    return this.modulesService.create(id, type, createModuleDto);
  }

  @Put('update')
  update(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() updateModuleDto: UpdateModuleWebvncDto | UpdateModuleWebviewDto
  ) {
    return this.modulesService.update(id, type, updateModuleDto);
  }

  @Delete('delete')
  remove(@Param('id') id: string, @Param('type') type: string) {
    return this.modulesService.remove(id);
  }
}
