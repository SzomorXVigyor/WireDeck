import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { DeviceDto } from './dto/device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';

/** Fields projected from the Device table - excludes createdAt / updatedAt / registers. */
const DEVICE_SELECT = { id: true, name: true, ip: true, port: true, protocol: true } as const;

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DeviceDto[]> {
    return this.prisma.device.findMany({ select: DEVICE_SELECT });
  }

  async findOne(id: number): Promise<DeviceDto> {
    return this.prisma.device.findUniqueOrThrow({
      where: { id },
      select: DEVICE_SELECT,
    });
  }

  async create(dto: CreateDeviceDto): Promise<DeviceDto> {
    return this.prisma.device.create({
      data: dto,
      select: DEVICE_SELECT,
    });
  }

  async update(id: number, dto: CreateDeviceDto): Promise<DeviceDto> {
    return this.prisma.device.update({
      where: { id },
      data: dto,
      select: DEVICE_SELECT,
    });
  }

  async remove(id: number): Promise<void> {
    await this.prisma.device.delete({ where: { id } });
  }
}
