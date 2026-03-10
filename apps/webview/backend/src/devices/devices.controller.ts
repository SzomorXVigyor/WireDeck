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
import { DevicesService } from './devices.service';
import { DeviceDto } from './dto/device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@ApiTags('devices')
@ApiBearerAuth()
@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('devices')
  @ApiOperation({ summary: 'List all devices' })
  @ApiResponse({ status: 200, description: 'Array of all registered devices', type: [DeviceDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  async findAll(): Promise<DeviceDto[]> {
    return this.devicesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('device/new')
  @ApiOperation({ summary: 'Create a new device (admin)' })
  @ApiBody({ type: CreateDeviceDto })
  @ApiResponse({ status: 201, description: 'Device created successfully', type: DeviceDto })
  @ApiResponse({ status: 400, description: 'Validation error - invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - unique constraint violation' })
  async create(@Body() dto: CreateDeviceDto): Promise<DeviceDto> {
    return this.devicesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('device/:id')
  @ApiOperation({ summary: 'Update an existing device (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'Device ID' })
  @ApiBody({ type: CreateDeviceDto })
  @ApiResponse({ status: 200, description: 'Device updated successfully', type: DeviceDto })
  @ApiResponse({ status: 400, description: 'Validation error - invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 409, description: 'Conflict - unique constraint violation' })
  @ApiResponse({ status: 500, description: 'Internal server error - unexpected database error' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateDeviceDto): Promise<DeviceDto> {
    return this.devicesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('device/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a device (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'Device ID' })
  @ApiResponse({ status: 204, description: 'Device deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 409, description: 'Conflict - device is still referenced by existing registers' })
  @ApiResponse({ status: 500, description: 'Internal server error - unexpected database error' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.devicesService.remove(id);
  }
}
