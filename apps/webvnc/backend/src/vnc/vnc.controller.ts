import { Controller, Get, UseGuards, Param, Query, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VncService } from './vnc.service';

@Controller('vnc')
@UseGuards(JwtAuthGuard)
export class VncController {
  constructor(private vncService: VncService) {}

  @Get('devices')
  getDevices() {
    const targets = this.vncService.getAllTargets();
    return {
      devices: targets.map(target => ({
        name: target.name,
        ip: target.ip,
        port: target.port,
        hasPassword: !!target.password,
        path: this.vncService.sanitizePath(target.name),
      })),
    };
  }

  @Get('connect/:deviceName')
  connectToDevice(
    @Param('deviceName') deviceName: string,
    @Query('autoconnect') autoconnect: string = '1',
    @Query('reconnect') reconnect: string = '1',
    @Query('resize') resize: string = 'scale',
    @Req() req: Request,
    @Res() res: Response
  ) {

    const target = this.vncService.getTargetByName(deviceName);
    
    if (!target) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Build simple noVNC URL with parameters
    const vncParams = new URLSearchParams({
      autoconnect,
      reconnect,
      reconnect_delay: '2000',
      resize,
      quality: '6',
      compression: '2',
      view_only: '0',
      shared: '1',
      path: `/api/vnc/connect?wss_identifier=${this.vncService.sanitizePath(target.name)}`,
    });

    if (target.password) {
      vncParams.set('password', target.password);
    }

    // Redirect to static noVNC
    const vncUrl = `/novnc/vnc.html?${vncParams.toString()}`;
    console.log(`Redirecting to: ${vncUrl}`);
    
    res.redirect(vncUrl);
  }
}