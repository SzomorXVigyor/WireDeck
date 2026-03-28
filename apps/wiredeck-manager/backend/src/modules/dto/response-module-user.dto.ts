import { OmitType } from '@nestjs/swagger';
import { ModuleUserEntity } from '../entities/module-user.entity';

/**
 * Response DTO for a module login user.
 * Omits: password, changeToken
 */
export class ResponseModuleUserDto extends OmitType(ModuleUserEntity, ['password', 'changeToken']) {}
