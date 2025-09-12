import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VncTarget {
  name: string;
  ip: string;
  port: number;
  password?: string;
}

@Injectable()
export class VncService {
  private vncTargets: VncTarget[];

  constructor(private configService: ConfigService) {
    this.vncTargets = this.configService.get<VncTarget[]>('VNC_TARGETS') || [];
    console.log(`🖥️ Loaded ${this.vncTargets.length} VNC targets from configuration`);
    this.vncTargets.forEach((target) => {
      console.log(`   - ${target.name}: ${target.ip}:${target.port}`);
    });
  }

  getAllTargets(): VncTarget[] {
    return this.vncTargets;
  }

  getTargetByName(name: string): VncTarget | undefined {
    return this.vncTargets.find((target) => this.sanitizePath(target.name) === this.sanitizePath(name));
  }

  sanitizePath(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
