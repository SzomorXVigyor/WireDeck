import { OmitType } from '@nestjs/swagger';
import { NotificationEntity } from '../entities/notification.entity';

export class CreateNotificationDto extends OmitType(NotificationEntity, ['id'] as const) {}
