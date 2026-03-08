import { Injectable } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { RegisterDictEntryDto } from './dto/register-dict-entry.dto';
import { CreateRegisterDto } from './dto/create-register.dto';
import { BaseProtocolAttributesEntity, PROTOCOL_ATTRIBUTES_MAP } from './entities/protocol-attributes';

@Injectable()
export class RegistersService {
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Looks up the device by id, resolves the correct protocol-attributes class
   * from PROTOCOL_ATTRIBUTES_MAP, and validates `attrs` against it.
   * Throws if the device is not found or attrs fail validation.
   */
  async validateProtocolAttributes(deviceId: number, attrs: unknown): Promise<BaseProtocolAttributesEntity> {
    throw new Error('Not implemented');
  }

  async findAll(): Promise<RegisterDictEntryDto[]> {
    throw new Error('Not implemented');
  }

  async create(dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    throw new Error('Not implemented');
  }

  async update(id: number, dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    throw new Error('Not implemented');
  }

  async remove(id: number): Promise<void> {
    throw new Error('Not implemented');
  }
}
