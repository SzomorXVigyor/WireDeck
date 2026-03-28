import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InstancesService } from './instances.service';
import { CreateInstanceDto } from './dto/create-instance.dto';

@Controller()
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post('instance/create')
  async create(@Body() createInstanceDto: CreateInstanceDto) {
    return this.instancesService.create(createInstanceDto);
  }

  @Get('instances')
  async list() {
    return this.instancesService.findAll();
  }

  @Delete('instance/delete')
  async delete(@Param('id') id: string) {
    return this.instancesService.delete(id);
  }
}
