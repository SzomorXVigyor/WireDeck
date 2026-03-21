import { Injectable } from '@nestjs/common';
import { CreateWebVNCModuleDto } from './dto/create-webvnc-module.dto';
import { CreateWebViewModuleDto } from './dto/create-webview-module.dto';
import { UpdateWebVNCModuleDto } from './dto/update-webvnc-module.dto';
import { UpdateWebViewModuleDto } from './dto/update-webview-module.dto';

@Injectable()
export class ModulesService {
  create(id: string, type: string, createModuleDto: CreateWebVNCModuleDto | CreateWebViewModuleDto) {
    throw new Error('Method not implemented.');
  }
  update(id: string, type: string, updateModuleDto: UpdateWebVNCModuleDto | UpdateWebViewModuleDto) {
    throw new Error('Method not implemented.');
  }
  remove(id: string) {
    throw new Error('Method not implemented.');
  }
}
