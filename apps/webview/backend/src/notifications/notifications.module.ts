import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationSenderService } from './notification-sender.service';
import { ConnectionModule } from '../connection/connection.module';

@Module({
  imports: [ConnectionModule],
  providers: [NotificationsService, NotificationSenderService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationSenderService],
})
export class NotificationsModule {}
