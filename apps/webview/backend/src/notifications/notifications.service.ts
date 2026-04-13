import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { NotificationDto } from './dto/notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

const NOTIFICATION_SELECT = {
  id: true,
  name: true,
  registerId: true,
  operator: true,
  conditionValue: true,
  mode: true,
  delaySeconds: true,
  recipients: true,
  subject: true,
  body: true,
} as const;

type NotificationRow = Prisma.NotificationGetPayload<{ select: typeof NOTIFICATION_SELECT }>;

function mapRow(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    name: row.name,
    registerId: row.registerId,
    operator: row.operator,
    conditionValue: row.conditionValue,
    mode: row.mode,
    delaySeconds: row.delaySeconds,
    recipients: row.recipients,
    subject: row.subject,
    body: row.body,
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<NotificationDto[]> {
    const rows = await this.prisma.notification.findMany({
      select: NOTIFICATION_SELECT,
      orderBy: { id: 'asc' },
    });
    return rows.map(mapRow);
  }

  async create(dto: CreateNotificationDto): Promise<NotificationDto> {
    const row = await this.prisma.notification.create({
      data: {
        name: dto.name,
        registerId: dto.registerId,
        operator: dto.operator,
        conditionValue: dto.conditionValue,
        mode: dto.mode,
        delaySeconds: dto.mode === 'delayed' ? dto.delaySeconds : 0,
        recipients: dto.recipients,
        subject: dto.subject,
        body: dto.body,
      },
      select: NOTIFICATION_SELECT,
    });
    this.logger.debug(`Notification created: id=${row.id} name="${row.name}"`);
    return mapRow(row);
  }

  async update(id: number, dto: CreateNotificationDto): Promise<NotificationDto> {
    const row = await this.prisma.notification.update({
      where: { id },
      data: {
        name: dto.name,
        registerId: dto.registerId,
        operator: dto.operator,
        conditionValue: dto.conditionValue,
        mode: dto.mode,
        delaySeconds: dto.mode === 'delayed' ? dto.delaySeconds : 0,
        recipients: dto.recipients,
        subject: dto.subject,
        body: dto.body,
      },
      select: NOTIFICATION_SELECT,
    });
    this.logger.debug(`Notification updated: id=${row.id} name="${row.name}"`);
    return mapRow(row);
  }

  async remove(id: number): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
    this.logger.debug(`Notification deleted: id=${id}`);
  }
}
