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
import { ViewsService } from './views.service';
import { ViewSummaryDto } from './dto/view-summary.dto';
import { ViewDto } from './dto/view.dto';
import { WriteRegisterDto } from './dto/write-register.dto';
import { RegisterValueDto } from './dto/register-value.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@ApiTags('views')
@ApiBearerAuth()
@Controller()
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('views')
  @ApiOperation({ summary: 'List all views (id + name)' })
  @ApiResponse({ status: 200, description: 'Array of view summaries', type: [ViewSummaryDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  async findAll(): Promise<ViewSummaryDto[]> {
    return this.viewsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('view/:id')
  @ApiOperation({ summary: 'Get a full view with all card components' })
  @ApiParam({ name: 'id', type: Number, description: 'View ID' })
  @ApiResponse({ status: 200, description: 'Full view with cards', type: ViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ViewDto> {
    return this.viewsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('view/new')
  @ApiOperation({ summary: 'Create a new empty view (admin)' })
  @ApiResponse({ status: 201, description: 'View created with a generated name', type: ViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async create(): Promise<ViewDto> {
    return this.viewsService.create();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('view/:id')
  @ApiOperation({ summary: 'Replace a full view including all card components (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'View ID' })
  @ApiBody({ type: ViewDto })
  @ApiResponse({ status: 200, description: 'Updated view', type: ViewDto })
  @ApiResponse({ status: 400, description: 'Validation error - invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ViewDto): Promise<ViewDto> {
    return this.viewsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('view/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a view and all its cards (admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'View ID' })
  @ApiResponse({ status: 204, description: 'View deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.viewsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('view/:id/data')
  @ApiOperation({ summary: 'Read live register values for all cards in a view' })
  @ApiParam({ name: 'id', type: Number, description: 'View ID' })
  @ApiResponse({ status: 200, description: 'Current value of each register in the view', type: [RegisterValueDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async getData(@Param('id', ParseIntPipe) id: number): Promise<RegisterValueDto[]> {
    return this.viewsService.getData(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('view/:id/data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Write a single register value (button press / switch toggle / number_input change)' })
  @ApiParam({ name: 'id', type: Number, description: 'View ID' })
  @ApiBody({ type: WriteRegisterDto })
  @ApiResponse({ status: 200, description: 'Confirmed register value after write', type: RegisterValueDto })
  @ApiResponse({ status: 400, description: 'Missing fields or register not part of this view' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async writeData(@Param('id', ParseIntPipe) id: number, @Body() dto: WriteRegisterDto): Promise<RegisterValueDto> {
    return this.viewsService.writeData(id, dto);
  }
}
