import { OmitType } from '@nestjs/swagger';
import { RegisterDictEntryEntity } from '../entities/register-dict-entry.entity';

export class CreateRegisterDto extends OmitType(RegisterDictEntryEntity, ['id'] as const) {}
