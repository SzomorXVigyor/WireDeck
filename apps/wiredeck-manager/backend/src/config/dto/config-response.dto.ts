import { ApiProperty } from '@nestjs/swagger';

export class ConfigFeaturesDto {}

/** Response body for GET /api/config */
export class ConfigResponseDto {
  @ApiProperty({ type: ConfigFeaturesDto })
  features: ConfigFeaturesDto;
}
