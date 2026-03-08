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
import { RegistersService } from './registers.service';
import { RegisterDictEntryDto } from './dto/register-dict-entry.dto';
import { CreateRegisterDto } from './dto/create-register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@Controller()
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('registers')
  async findAll(): Promise<RegisterDictEntryDto[]> {
    return this.registersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('register/new')
  async create(@Body() dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    return this.registersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('register/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateRegisterDto): Promise<RegisterDictEntryDto> {
    return this.registersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('register/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.registersService.remove(id);
  }
}
