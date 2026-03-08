import { Controller, Get } from '@nestjs/common';
import { WIREDECK_SLAVE, PASS_CHANGE_URL, SERVICE_NAME } from '../utils/env';
import { ConfigResponseDto } from './dto/config-response.dto';

@Controller('config')
export class ConfigController {
  constructor() {}

  @Get()
  getConfig(): ConfigResponseDto {
    const passwordChangeEnabled: boolean = WIREDECK_SLAVE && PASS_CHANGE_URL && SERVICE_NAME ? true : false;

    return {
      features: {
        passwordChange: passwordChangeEnabled,
      },
    };
  }
}
