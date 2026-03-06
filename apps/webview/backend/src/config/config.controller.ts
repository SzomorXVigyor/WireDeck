import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WIREDECK_SLAVE, PASS_CHANGE_URL, SERVICE_NAME } from '../utils/env';

@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get()
  getConfig() {
    const passwordChangeEnabled: boolean = WIREDECK_SLAVE && PASS_CHANGE_URL && SERVICE_NAME ? true : false;

    return {
      features: {
        passwordChange: passwordChangeEnabled,
      },
    };
  }
}
