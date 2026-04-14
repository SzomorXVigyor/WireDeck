import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationSenderService } from './notification-sender.service';
import { NotificationDto } from './dto/notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly senderService: NotificationSenderService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('notifications')
  @ApiOperation({ summary: 'List all notification entries (admin)' })
  @ApiResponse({ status: 200, description: 'Array of all notification entries', type: [NotificationDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async findAll(): Promise<NotificationDto[]> {
    return this.notificationsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('notification/new')
  @ApiOperation({ summary: 'Create a new notification entry (admin)' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 201, description: 'Notification entry created successfully', type: NotificationDto })
  @ApiResponse({ status: 400, description: 'Validation error - invalid fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Referenced register not found' })
  async create(@Body() dto: CreateNotificationDto): Promise<NotificationDto> {
    const result = await this.notificationsService.create(dto);
    this.senderService.attachHandler(result.id, result.registerId);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('notification/:id')
  @ApiOperation({ summary: 'Replace a notification entry (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'Notification entry ID' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification entry updated successfully', type: NotificationDto })
  @ApiResponse({ status: 400, description: 'Validation error - invalid fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Notification entry or referenced register not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateNotificationDto): Promise<NotificationDto> {
    // Get old entry to detect registerId change
    const old = await this.notificationsService.findOne(id);
    if (!old) throw new NotFoundException(`Notification ${id} not found`);

    const result = await this.notificationsService.update(id, dto);

    // Re-attach handler if the register changed
    if (old.registerId !== result.registerId) {
      this.senderService.detachHandler(id, old.registerId);
    }
    this.senderService.attachHandler(result.id, result.registerId);

    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('notification/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification entry (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'Notification entry ID' })
  @ApiResponse({ status: 204, description: 'Notification entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Notification entry not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    // Get registerId before deletion so we can detach the handler
    const entry = await this.notificationsService.findOne(id);
    if (!entry) throw new NotFoundException(`Notification ${id} not found`);

    this.senderService.detachHandler(id, entry.registerId);
    return this.notificationsService.remove(id);
  }
}
