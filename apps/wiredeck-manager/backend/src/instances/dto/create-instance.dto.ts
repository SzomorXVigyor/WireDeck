import { PickType } from '@nestjs/swagger';
import { InstanceEntity } from '../entities/instance.entity';

// name, ipv4cidr, username, password
export class CreateInstanceDto extends PickType(InstanceEntity, [
  'name',
  'internal_ipv4Cidr',
  'username',
  'password',
]) {}
