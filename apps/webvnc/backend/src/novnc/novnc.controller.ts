import { Controller, Get, Res, Req } from '@nestjs/common';
import { join } from 'path';
import { Response, Request } from 'express';
import { existsSync } from 'fs';
import * as jwt from 'jsonwebtoken';

@Controller('novnc')
export class NoVNCController {
  private readonly novncPath = join(__dirname, '..', '..', 'public', 'novnc');

  @Get('*')
  serveFile(@Req() req: Request, @Res() res: Response) {
    // Only protect vnc.html with the short-lived token
    const relativePath = req.params[0] || '';
    const filePath = join(this.novncPath, relativePath);

    if (!existsSync(filePath)) {
      return res.redirect('/');
    }

    // If requesting vnc.html, validate the short token
    if (relativePath === 'vnc.html') {
      const token = req.query.token as string;

      console.log('Validating token for vnc.html:', token);

      if (!token) {
        return res.redirect('/');
      }

      try {
        jwt.verify(token, process.env.VNC_SECRET || process.env.JWT_SECRET);
      } catch (err) {
        return res.redirect('/');
      }
    }

    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(filePath);
  }
}
