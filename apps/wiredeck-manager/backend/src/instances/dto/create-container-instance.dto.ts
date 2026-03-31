import { PickType } from '@nestjs/swagger';
import { InstanceEntity } from '../entities/instance.entity';

export class CreateContainerInstanceDto extends PickType(InstanceEntity, [
  'id',
  'name',
  'ipv4',
  'publicPort',
  'internal_ipv4Cidr',
  'username',
  'password',
  'subdomain',
]) {}
