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
import { ViewsService } from './views.service';
import { ViewSummaryDto } from './dto/view-summary.dto';
import { ViewDto } from './dto/view.dto';
import { WriteRegisterDto } from './dto/write-register.dto';
import { RegisterValueDto } from './dto/register-value.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@Controller()
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('views')
  async findAll(): Promise<ViewSummaryDto[]> {
    return this.viewsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('view/:id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ViewDto> {
    return this.viewsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('view/new')
  async create(): Promise<ViewDto> {
    return this.viewsService.create();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('view/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ViewDto): Promise<ViewDto> {
    return this.viewsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('view/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.viewsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('view/:id/data')
  async getData(@Param('id', ParseIntPipe) id: number): Promise<RegisterValueDto[]> {
    return this.viewsService.getData(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('view/:id/data')
  @HttpCode(HttpStatus.OK)
  async writeData(@Param('id', ParseIntPipe) id: number, @Body() dto: WriteRegisterDto): Promise<RegisterValueDto> {
    return this.viewsService.writeData(id, dto);
  }
}
