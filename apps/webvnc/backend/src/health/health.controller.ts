import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'child_process';

@Controller('health')
export class HealthController {
  constructor(private configService: ConfigService) {}

  @Get()
  getHealth() {
    const vncTargets = this.configService.get('VNC_TARGETS') || [];
    const users = this.configService.get('USERS') || [];

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        vncTargets: vncTargets.length,
        users: users.length,
        wireguard: this.checkWireGuardStatus(),
      },
    };
  }

  private checkWireGuardStatus() {
    try {
      let output = execSync('wg show wg0', { encoding: 'utf8' });
      if (!output || output.trim() === '') {
        return { status: 'disconnected', details: 'Wireguard not responding' };
      }
      output = output.split('latest handshake:')[1]?.trim().split('\n')[0] || 'No handshake info';
      return { status: 'connected', details: output };
    } catch (error) {
      return { status: 'disconnected', error: error.message };
    }
  }
}
