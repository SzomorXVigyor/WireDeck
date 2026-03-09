import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ViewSummaryDto } from './dto/view-summary.dto';
import { ViewDto, ViewLayoutDto } from './dto/view.dto';
import type { CardDto, CardStyleDto } from './dto/card.dto';
import { WriteRegisterDto } from './dto/write-register.dto';
import { RegisterValueDto } from './dto/register-value.dto';
import { QueryRegistersDto } from './dto/query-registers.dto';

/** Prisma select shape for a full view with its ordered cards. */
const VIEW_WITH_CARDS_SELECT = {
  id: true,
  name: true,
  layout: true,
  components: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      name: true,
      type: true,
      order: true,
      registerId: true,
      style: true,
      extra: true,
    },
  },
} satisfies Prisma.ViewSelect;

type ViewRow = Prisma.ViewGetPayload<{ select: typeof VIEW_WITH_CARDS_SELECT }>;

/** Maps a Prisma row to the ViewDto shape (registerId → register, Json casts). */
function mapViewRow(row: ViewRow): ViewDto {
  return {
    id: row.id,
    name: row.name,
    layout: row.layout as unknown as ViewLayoutDto,
    components: row.components.map(
      (c): CardDto => ({
        id: c.id,
        name: c.name,
        type: c.type,
        order: c.order,
        register: c.registerId,
        style: c.style ? (c.style as unknown as CardStyleDto) : undefined,
        extra: c.extra ? (c.extra as unknown as Record<string, unknown>) : undefined,
      })
    ),
  };
}

@Injectable()
export class ViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ViewSummaryDto[]> {
    return this.prisma.view.findMany({ select: { id: true, name: true } });
  }

  async findOne(id: number): Promise<ViewDto> {
    const row = await this.prisma.view.findUniqueOrThrow({
      where: { id },
      select: VIEW_WITH_CARDS_SELECT,
    });
    return mapViewRow(row);
  }

  async create(): Promise<ViewDto> {
    const count = await this.prisma.view.count();
    const row = await this.prisma.view.create({
      data: {
        name: `New View ${count + 1}`,
        layout: { type: 'fill', updateInterval: 5 } as Prisma.InputJsonValue,
      },
      select: VIEW_WITH_CARDS_SELECT,
    });
    return mapViewRow(row);
  }

  async update(id: number, dto: ViewDto): Promise<ViewDto> {
    const row = await this.prisma.view.update({
      where: { id },
      data: {
        name: dto.name,
        layout: dto.layout as unknown as Prisma.InputJsonValue,
        components: {
          deleteMany: {},
          create: dto.components.map((card) => ({
            name: card.name,
            type: card.type,
            order: card.order,
            registerId: card.register,
            ...(card.style != null && { style: card.style as Prisma.InputJsonValue }),
            ...(card.extra != null && { extra: card.extra as Prisma.InputJsonValue }),
          })),
        },
      },
      select: VIEW_WITH_CARDS_SELECT,
    });
    return mapViewRow(row);
  }

  async remove(id: number): Promise<void> {
    await this.prisma.view.delete({ where: { id } });
  }

  async getData(id: number, dto: QueryRegistersDto): Promise<RegisterValueDto[]> {
    // generate mock data for the requested registers
    return dto.registers.map((reg) => ({
      register: reg,
      value: Math.floor(Math.random() * 100), // random value for demo purposes
    }));
  }

  async writeData(id: number, dto: WriteRegisterDto): Promise<RegisterValueDto> {
    // generate mock data for the requested register
    return {
      register: dto.register,
      value: Math.floor(Math.random() * 100), // random value for demo purposes
    };
  }
}
