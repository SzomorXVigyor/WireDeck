import { Controller, Get, UseGuards, Param, Req, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VncService } from './vnc.service';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';

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
  @UseGuards(JwtAuthGuard)
  async connectToDevice(
    @Param('deviceName') deviceName: string,
    @Res() res: Response,
    @Req() req
  ) {
    const target = this.vncService.getTargetByName(deviceName);
    if (!target) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Create short-lived token (1 min)
    const shortToken = jwt.sign(
      {
        sub: req.user.id,         // authenticated user
        device: deviceName,
      },
      process.env.VNC_SECRET || process.env.JWT_SECRET,
      { expiresIn: '60s' }
    );

    const vncParams = new URLSearchParams({
      path: `/api/vnc/connect?wss_identifier=${this.vncService.sanitizePath(target.name)}`,
      token: shortToken,
    });

    if (target.password) {
      vncParams.set('password', target.password);
    }

    return res.json({
      url: `/novnc/vnc.html?${vncParams.toString()}`,
    });
  }
}
