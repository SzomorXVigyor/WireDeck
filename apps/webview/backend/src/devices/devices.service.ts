import { Injectable } from '@nestjs/common';
import { DeviceDto } from './dto/device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  async findAll(): Promise<DeviceDto[]> {
    throw new Error('Not implemented');
  }

  async findOne(id: number): Promise<DeviceDto> {
    throw new Error('Not implemented');
  }

  async create(dto: CreateDeviceDto): Promise<DeviceDto> {
    throw new Error('Not implemented');
  }

  async update(id: number, dto: CreateDeviceDto): Promise<DeviceDto> {
    throw new Error('Not implemented');
  }

  async remove(id: number): Promise<void> {
    throw new Error('Not implemented');
  }
}
