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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationDto } from './dto/notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
    return this.notificationsService.create(dto);
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
    return this.notificationsService.update(id, dto);
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
    return this.notificationsService.remove(id);
  }
}
