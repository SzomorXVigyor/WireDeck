import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { DeviceDto } from './dto/device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ConnectionManagerService } from '../connection/connection-manager.service';
import { Prisma } from '@prisma/client';

/** Fields projected from the Device table - excludes createdAt / updatedAt / registers. */
const DEVICE_SELECT = { id: true, name: true, ip: true, port: true, protocol: true } as const;

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionManager: ConnectionManagerService
  ) {}

  async findAll(): Promise<DeviceDto[]> {
    return this.prisma.device.findMany({ select: DEVICE_SELECT, orderBy: { id: 'asc' } });
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
    this.logger.debug(
      `Device created: id=${device.id} name="${device.name}" (${device.protocol} ${device.ip}:${device.port})`
    );
    await this.connectionManager.onDeviceCreated(device);
    return device;
  }

  async update(id: number, dto: CreateDeviceDto): Promise<DeviceDto> {
    const device = await this.prisma.device.update({
      where: { id },
      data: dto,
      select: DEVICE_SELECT,
    });
    this.logger.debug(`Device updated: id=${device.id} name="${device.name}"`);
    await this.connectionManager.onDeviceUpdated(device);
    return device;
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.device.delete({ where: { id } });
      this.logger.debug(`Device deleted: id=${id}`);
      await this.connectionManager.onDeviceDeleted(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictException(`Device ${id} cannot be deleted - it is still referenced by existing registers`);
      }
      throw err;
    }
  }
}
