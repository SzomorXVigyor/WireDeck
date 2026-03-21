import { Injectable } from '@nestjs/common';
import { CreateInstanceDto } from './dto/create-instance.dto';

@Injectable()
export class InstancesService {
  create(createInstanceDto: CreateInstanceDto) {
    throw new Error('Method not implemented.');
  }

  findAll() {
    const instances = [
      {
        id: '0',
        name: '0-name',
        ipv4: '93.12.33.1',
        publicPort: 51820,
        internal_ipv4Cidr: '10.0.0.1/24',
        createdAt: '2026-03-10T10:00:00Z',
        status: 'running',
        subdomain: 'wg0.wiredeck.local',
        modules: {
          webVNC: {
            ipv4: '10.0.0.2',
            loginUsers: [{ username: 'vnc_admin', changeToken: 'token123' }],
            vncDevices: [{ name: 'server1', ip: '10.0.0.10', port: 5900 }],
            updatedAt: '2026-03-11T12:00:00Z',
            createdAt: '2026-03-11T12:00:00Z',
            status: 'running',
            subdomain: 'vnc.wg0.wiredeck.local',
            version: '1.0.0',
          },
          webView: {
            ipv4: '10.0.0.3',
            loginUsers: [{ username: 'view_admin', changeToken: 'token456', role: 'admin' }],
            updatedAt: '2026-03-11T12:00:00Z',
            createdAt: '2026-03-11T12:00:00Z',
            status: 'running',
            subdomain: 'view.wg0.wiredeck.local',
            version: '1.0.0',
          },
        },
      },
      {
        id: '1',
        name: '1-name',
        ipv4: '93.12.33.1',
        publicPort: 51821,
        internal_ipv4Cidr: '10.0.1.1/24',
        createdAt: '2026-03-12T10:00:00Z',
        status: 'offline',
        subdomain: 'wg1.wiredeck.local',
        modules: {},
      },
    ];
    return instances;
  }

  delete(id: string) {
    throw new Error('Method not implemented.');
  }
}
