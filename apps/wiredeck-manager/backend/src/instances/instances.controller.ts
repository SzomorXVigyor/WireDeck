import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { InstancesService } from './instances.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { ResponseInstanceDto } from './dto/response-instance.dto';

@Controller()
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post('instance/create')
  async create(@Body() createInstanceDto: CreateInstanceDto): Promise<ResponseInstanceDto> {
    return this.instancesService.create(createInstanceDto);
  }

  @Get('instances')
  async list(): Promise<ResponseInstanceDto[]> {
    return this.instancesService.findAll();
  }

  @Delete('instance/delete')
  async remove(@Query('id') id: string) {
    return this.instancesService.remove(id);
  }
}
