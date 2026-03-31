import { IsEnum, IsString } from 'class-validator';

export enum CertbotMode {
  OBTAIN = 'obtain',
  RENEW = 'renew',
}

export class CreateContainerCertbotDto {
  @IsString()
  domain: string;
  @IsEnum(CertbotMode)
  mode: CertbotMode;
}
