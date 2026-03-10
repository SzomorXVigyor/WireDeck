import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { DeviceDto } from './dto/device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ConnectionManagerService } from '../connection/connection-manager.service';
import { Prisma } from '@prisma/client';

/** Fields projected from the Device table - excludes createdAt / updatedAt / registers. */
const DEVICE_SELECT = { id: true, name: true, ip: true, port: true, protocol: true } as const;

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionManager: ConnectionManagerService
  ) {}

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
    const device = await this.prisma.device.create({
      data: dto,
      select: DEVICE_SELECT,
    });
    await this.connectionManager.onDeviceCreated(device);
    return device;
  }

  async update(id: number, dto: CreateDeviceDto): Promise<DeviceDto> {
    const device = await this.prisma.device.update({
      where: { id },
      data: dto,
      select: DEVICE_SELECT,
    });
    await this.connectionManager.onDeviceUpdated(device);
    return device;
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.device.delete({ where: { id } });
      await this.connectionManager.onDeviceDeleted(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new BadRequestException(`Unable to delete device ${id} - bound to a view`);
      }
    }
  }
}
