import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateWebVNCModuleDto } from './dto/create-webvnc-module.dto';
import { CreateWebViewModuleDto } from './dto/create-webview-module.dto';
import { UpdateWebVNCModuleDto } from './dto/update-webvnc-module.dto';
import { UpdateWebViewModuleDto } from './dto/update-webview-module.dto';

@Controller('instance/module')
@ApiTags('instance/module')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post('create')
  create(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() createModuleDto: CreateWebVNCModuleDto | CreateWebViewModuleDto
  ) {
    return this.modulesService.create(id, type, createModuleDto);
  }

  @Put('update')
  update(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() updateModuleDto: UpdateWebVNCModuleDto | UpdateWebViewModuleDto
  ) {
    return this.modulesService.update(id, type, updateModuleDto);
  }

  @Delete('delete')
  remove(@Param('id') id: string, @Param('type') type: string) {
    return this.modulesService.remove(id);
  }
}
