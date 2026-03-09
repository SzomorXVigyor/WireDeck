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
import { RegistersService } from './registers.service';
import { RegisterDictEntryDto } from './dto/register-dict-entry.dto';
import { CreateRegisterDto } from './dto/create-register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@ApiTags('registers')
@ApiBearerAuth()
@Controller()
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('registers')
  @ApiOperation({ summary: 'List all register dictionary entries' })
  @ApiResponse({ status: 200, description: 'Array of all register entries', type: [RegisterDictEntryDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  async findAll(): Promise<RegisterDictEntryDto[]> {
    return this.registersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('register/new')
  @ApiOperation({ summary: 'Create a new register dictionary entry (admin)' })
  @ApiBody({ type: CreateRegisterDto })
  @ApiResponse({ status: 201, description: 'Register entry created successfully', type: RegisterDictEntryDto })
  @ApiResponse({ status: 400, description: 'Validation error - invalid fields or protocol attributes' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Referenced device not found' })
  async create(@Body() dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    return this.registersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('register/:id')
  @ApiOperation({ summary: 'Replace a register dictionary entry (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'Register entry ID' })
  @ApiBody({ type: CreateRegisterDto })
  @ApiResponse({ status: 200, description: 'Register entry updated successfully', type: RegisterDictEntryDto })
  @ApiResponse({ status: 400, description: 'Validation error - invalid fields or protocol attributes' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Register entry or referenced device not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    return this.registersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('register/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a register dictionary entry (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'Register entry ID' })
  @ApiResponse({ status: 204, description: 'Register entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Register entry not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.registersService.remove(id);
  }
}
