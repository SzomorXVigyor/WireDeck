import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { mapInstanceToResponse, instanceInclude, PrismaInstanceWithModules } from './instance.mapper';
import { ResponseInstanceDto } from './dto/response-instance.dto';
import { PrismaService } from 'nestjs-prisma';
import { sanitizeServiceName } from 'src/utils/common';
import { INSTANCE_START_IP, INSTANCE_START_PORT, INSTANCE_INTERNAL_SUBNET, ROOT_DOMAIN } from 'src/utils/env';

@Injectable()
export class InstancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInstanceDto: CreateInstanceDto): Promise<ResponseInstanceDto> {
    const serviceName = sanitizeServiceName(createInstanceDto.name);
    const subdomain = `${serviceName}.${ROOT_DOMAIN}`;

    // Fetch only the fields needed for IP/port allocation (sorted for gap-finding)
    const existingIps = await this.prisma.instance.findMany({
      select: { ipv4: true },
      orderBy: { ipv4: 'asc' },
    });
    const existingPorts = await this.prisma.instance.findMany({
      select: { publicPort: true },
      orderBy: { publicPort: 'asc' },
    });

    const nextAvailableIp = this.getNextAvailableIp(existingIps.map((i) => i.ipv4));
    const nextAvailablePort = this.getNextAvailablePort(existingPorts.map((i) => i.publicPort));

    // Atomically create Domain + Instance + ModuleList
    // Name uniqueness is enforced by Prisma @unique constraint → P2002 → 409 Conflict
    const instance = await this.prisma.$transaction(async (tx) => {
      await tx.domain.upsert({
        where: { domain: subdomain },
        update: {},
        create: { domain: subdomain },
      });

      const newInstance = await tx.instance.create({
        data: {
          name: serviceName,
          ipv4: nextAvailableIp,
          publicPort: nextAvailablePort,
          internal_ipv4Cidr: createInstanceDto.internal_ipv4Cidr || INSTANCE_INTERNAL_SUBNET,
          username: createInstanceDto.username,
          password: createInstanceDto.password,
          subdomainValue: subdomain,
        },
      });

      await tx.moduleList.create({
        data: { instanceId: newInstance.id },
      });

      return newInstance;
    });

    return mapInstanceToResponse(instance as PrismaInstanceWithModules);
  }

  async findOne(id: string): Promise<ResponseInstanceDto> {
    const instance = await this.prisma.instance.findUnique({
      where: { id },
      include: instanceInclude,
    });

    if (!instance) {
      throw new NotFoundException(`Instance with id "${id}" not found`);
    }

    return mapInstanceToResponse(instance as PrismaInstanceWithModules);
  }

  async findAll(): Promise<ResponseInstanceDto[]> {
    const instances = await this.prisma.instance.findMany({
      include: instanceInclude,
    });

    return instances.map((instance) => mapInstanceToResponse(instance as PrismaInstanceWithModules));
  }

  async remove(id: string) {
    const instance = await this.prisma.instance.findUnique({
      where: { id },
      include: instanceInclude,
    });

    if (!instance) {
      throw new NotFoundException(`Instance with id "${id}" not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.moduleList.delete({ where: { instanceId: id } });
      await tx.instance.delete({ where: { id } });
    });
  }

  // ---------------------------------------------------------------------------
  // IP / Port allocation helpers
  // ---------------------------------------------------------------------------

  /** Find the next available last-octet in the /24 range starting from INSTANCE_START_IP. */
  private getNextAvailableIp(sortedIps: string[]): string {
    const baseOctet = parseInt(INSTANCE_START_IP.split('.')[3]);
    const ipPrefix = INSTANCE_START_IP.split('.').slice(0, 3).join('.');

    let nextOctet = baseOctet;

    for (const ip of sortedIps) {
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

  /** Find the next available port starting from INSTANCE_START_PORT. */
  private getNextAvailablePort(sortedPorts: number[]): number {
    let nextPort = INSTANCE_START_PORT;

    for (const port of sortedPorts) {
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
