import { Type } from '@nestjs/common';
import { DeviceProtocol } from '@prisma/client';
import { BaseProtocolAttributesEntity } from './base-protocol-attributes.entity';
import { ModbusTcpProtocolAttributesEntity } from './modbus-tcp-protocol-attributes.entity';

export { BaseProtocolAttributesEntity } from './base-protocol-attributes.entity';
export {
  ModbusTcpProtocolAttributesEntity,
  RegisterType,
  RegisterOperation,
} from './modbus-tcp-protocol-attributes.entity';

export type ProtocolAttributes = ModbusTcpProtocolAttributesEntity;

/**
 * Maps each DeviceProtocol to its concrete protocol-attributes class.
 * To add a new protocol:
 *   1. Create a class extending BaseProtocolAttributesEntity.
 *   2. Add a DeviceProtocol enum value.
 *   3. Add a single entry here.
 */
export const PROTOCOL_ATTRIBUTES_MAP: Record<DeviceProtocol, Type<BaseProtocolAttributesEntity>> = {
  [DeviceProtocol.ModbusTCP]: ModbusTcpProtocolAttributesEntity,
};
