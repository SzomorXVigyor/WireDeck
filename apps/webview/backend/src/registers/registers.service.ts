import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DevicesService } from '../devices/devices.service';
import { RegisterDictEntryDto } from './dto/register-dict-entry.dto';
import { CreateRegisterDto } from './dto/create-register.dto';
import { BaseProtocolAttributesEntity, PROTOCOL_ATTRIBUTES_MAP } from './entities/protocol-attributes';
import { ConnectionManagerService } from '../connection/connection-manager.service';

const REGISTER_SELECT = {
  id: true,
  name: true,
  deviceId: true,
  protocolAttributes: true,
} as const;

type RegisterRow = Prisma.RegisterDictEntryGetPayload<{ select: typeof REGISTER_SELECT }>;

function mapRow(row: RegisterRow): RegisterDictEntryDto {
  return {
    id: row.id,
    name: row.name,
    deviceId: row.deviceId,
    protocolAttributes: row.protocolAttributes as unknown as BaseProtocolAttributesEntity,
  };
}

@Injectable()
export class RegistersService {
  private readonly logger = new Logger(RegistersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
    private readonly connectionManager: ConnectionManagerService
  ) {}

  /**
   * Looks up the device by id, resolves the correct protocol-attributes class
   * from PROTOCOL_ATTRIBUTES_MAP, and validates `attrs` against it.
   * Throws if the device is not found or attrs fail validation.
   */
  async validateProtocolAttributes(deviceId: number, attrs: unknown): Promise<BaseProtocolAttributesEntity> {
    const device = await this.devicesService.findOne(deviceId); // P2025 → 404 if missing
    const AttrClass = PROTOCOL_ATTRIBUTES_MAP[device.protocol];
    const instance = plainToInstance(AttrClass, attrs);
    const errors = await validate(instance);
    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      this.logger.warn(`Protocol attribute validation failed for device ${deviceId}: ${messages.join(', ')}`);
      throw new BadRequestException(messages);
    }
    return instance;
  }

  async findAll(): Promise<RegisterDictEntryDto[]> {
    const rows = await this.prisma.registerDictEntry.findMany({ select: REGISTER_SELECT, orderBy: { id: 'asc' } });
    return rows.map(mapRow);
  }

  async create(dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    const validAttrs = await this.validateProtocolAttributes(dto.deviceId, dto.protocolAttributes);
    const row = await this.prisma.registerDictEntry.create({
      data: {
        name: dto.name,
        deviceId: dto.deviceId,
        protocolAttributes: validAttrs as unknown as Prisma.InputJsonValue,
      },
      select: REGISTER_SELECT,
    });
    this.logger.debug(`Register created: id=${row.id} name="${row.name}" deviceId=${row.deviceId}`);
    this.connectionManager.onRegisterCreated(row);
    return mapRow(row);
  }

  async update(id: number, dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    const validAttrs = await this.validateProtocolAttributes(dto.deviceId, dto.protocolAttributes);
    const row = await this.prisma.registerDictEntry.update({
      where: { id },
      data: {
        name: dto.name,
        deviceId: dto.deviceId,
        protocolAttributes: validAttrs as unknown as Prisma.InputJsonValue,
      },
      select: REGISTER_SELECT,
    });
    this.logger.debug(`Register updated: id=${row.id} name="${row.name}"`);
    this.connectionManager.onRegisterUpdated(row);
    return mapRow(row);
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.registerDictEntry.delete({ where: { id } });
      this.logger.debug(`Register deleted: id=${id}`);
      this.connectionManager.onRegisterDeleted(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictException(`Register ${id} cannot be deleted - it is still referenced by view cards`);
      }
      throw err;
    }
  }
}
