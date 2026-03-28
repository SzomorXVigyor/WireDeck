import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { mapInstanceToResponse, instanceInclude } from './instance.mapper';
import { ResponseInstanceDto } from './dto/response-instance.dto';
import { PrismaService } from 'nestjs-prisma';
import { sanitizeServiceName } from 'src/utils/common';
import { INSTANCE_START_IP, INSTANCE_START_PORT, ROOT_DOMAIN } from 'src/utils/env';

@Injectable()
export class InstancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInstanceDto: CreateInstanceDto) {
    // On first get all instance name to check it is unique
    const instances = await this.prisma.instance.findMany();
    if (instances.some((instance) => instance.name === createInstanceDto.name)) {
      throw new BadRequestException('Instance name already exists');
    }

    // get a array of instances ports
    const instanceIps = instances.map((instance) => instance.ipv4);
    const instancePorts = instances.map((instance) => instance.publicPort);

    const serviceName = sanitizeServiceName(createInstanceDto.name);
    const nextAvailableIp = this.getNextAvailableIp(instanceIps);
    const nextAvailablePort = this.getNextAvailablePort(instancePorts);
    const subdomain = `${serviceName}.${ROOT_DOMAIN}`;

    // Use a transaction to atomically create the Domain + Instance + ModuleList
    const instance = await this.prisma.$transaction(async (tx) => {
      // 1. Ensure the Domain record exists (required by Instance FK)
      await tx.domain.upsert({
        where: { domain: subdomain },
        update: {},
        create: { domain: subdomain },
      });

      // 2. Create the Instance (linked to the Domain)
      const newInstance = await tx.instance.create({
        data: {
          name: serviceName,
          ipv4: nextAvailableIp,
          publicPort: nextAvailablePort,
          internal_ipv4Cidr: createInstanceDto.internal_ipv4Cidr,
          username: createInstanceDto.username,
          password: createInstanceDto.password,
          subdomainValue: subdomain,
        },
      });

      // 3. Create the ModuleList for this instance
      await tx.moduleList.create({
        data: {
          instanceId: newInstance.id,
        },
      });

      return newInstance;
    });

    return instance;
  }

  async findOne(id: string): Promise<ResponseInstanceDto> {
    const instance = await this.prisma.instance.findUnique({
      where: { id },
      include: instanceInclude,
    });

    if (!instance) {
      throw new NotFoundException(`Instance with id "${id}" not found`);
    }

    return mapInstanceToResponse(instance as any);
  }

  async findAll(): Promise<ResponseInstanceDto[]> {
    const instances = await this.prisma.instance.findMany({
      include: instanceInclude,
    });

    return instances.map((instance) => mapInstanceToResponse(instance as any));
  }

  delete(id: string) {
    throw new Error('Method not implemented.');
  }

  // Get the next available ip address from the INSTANCE_START_IP check the /24 subnet (last octet)
  private getNextAvailableIp(instanceIps: string[]): string {
    const baseOctet = parseInt(INSTANCE_START_IP.split('.')[3]);
    const ipPrefix = INSTANCE_START_IP.split('.').slice(0, 3).join('.');

    let nextOctet = baseOctet;

    for (const ip of instanceIps) {
      const lastOctet = parseInt(ip.split('.')[3]);

      if (lastOctet === nextOctet) {
        nextOctet++;
      } else if (lastOctet > nextOctet) {
        break;
      }

      if (nextOctet >= 254) {
        throw new BadRequestException('No more available ip addresses');
      }
    }

    return `${ipPrefix}.${nextOctet}`;
  }

  // Get the next available port from the INSTANCE_START_PORT check the next practically 255 ports
  private getNextAvailablePort(instancePorts: number[]): number {
    let nextPort = INSTANCE_START_PORT;

    for (const port of instancePorts) {
      if (port === nextPort) {
        nextPort++;
      } else if (port > nextPort) {
        break;
      }

      if (nextPort >= 65535) {
        throw new BadRequestException('No more available ports');
      }
    }

    return nextPort;
  }
}
