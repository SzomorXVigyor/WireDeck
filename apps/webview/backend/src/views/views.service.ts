import { Injectable } from '@nestjs/common';
import { ViewSummaryDto } from './dto/view-summary.dto';
import { ViewDto } from './dto/view.dto';
import { WriteRegisterDto } from './dto/write-register.dto';
import { RegisterValueDto } from './dto/register-value.dto';

@Injectable()
export class ViewsService {
  async findAll(): Promise<ViewSummaryDto[]> {
    throw new Error('Not implemented');
  }

  async findOne(id: number): Promise<ViewDto> {
    throw new Error('Not implemented');
  }

  async create(): Promise<ViewDto> {
    throw new Error('Not implemented');
  }

  async update(id: number, dto: ViewDto): Promise<ViewDto> {
    throw new Error('Not implemented');
  }

  async remove(id: number): Promise<void> {
    throw new Error('Not implemented');
  }

  async getData(id: number): Promise<RegisterValueDto[]> {
    throw new Error('Not implemented');
  }

  async writeData(id: number, dto: WriteRegisterDto): Promise<RegisterValueDto> {
    throw new Error('Not implemented');
  }
}
