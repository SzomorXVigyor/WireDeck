import { ApiProperty } from '@nestjs/swagger';

export class ConfigFeaturesDto {
  @ApiProperty({ example: true })
  passwordChange: boolean;
}

/** Response body for GET /api/config */
export class ConfigResponseDto {
  @ApiProperty({ type: ConfigFeaturesDto })
  features: ConfigFeaturesDto;
}
