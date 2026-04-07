import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma, ModuleList } from '@prisma/client';

import { CreateModuleWebvncDto } from './dto/create-module-webvnc.dto';
import { CreateModuleWebviewDto } from './dto/create-module-webview.dto';
import { UpdateModuleWebvncDto } from './dto/update-module-webvnc.dto';
import { UpdateModuleWebviewDto } from './dto/update-module-webview.dto';
import { ResponseModuleWebvncDto } from './dto/response-module-webvnc.dto';
import { ResponseModuleWebviewDto } from './dto/response-module-webview.dto';
import {
  deriveWebVncIpv4,
  deriveWebViewIpv4,
  deriveModuleSubdomain,
  mapWebView,
  mapWebVnc,
  MODULE_VERSION,
} from './module.mapper';

/** Supported module types. */
export enum ModuleType {
  WEBVNC = 'webvnc',
  WEBVIEW = 'webview',
}

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async create(
    instanceId: string,
    type: ModuleType,
    createModuleDto: CreateModuleWebvncDto | CreateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
      include: { modules: true },
    });

    if (!instance) {
      throw new NotFoundException(`Instance "${instanceId}" not found`);
    }

    if (!instance.modules) {
      throw new NotFoundException(`No ModuleList found for instance "${instanceId}"`);
    }

    const moduleList = instance.modules;

    switch (type) {
      case ModuleType.WEBVNC:
        return this.createWebVnc(moduleList, instance, createModuleDto as CreateModuleWebvncDto);
      case ModuleType.WEBVIEW:
        return this.createWebView(moduleList, instance, createModuleDto as CreateModuleWebviewDto);
      default:
        throw new BadRequestException(
          `Unknown module type "${type}". Expected "${ModuleType.WEBVNC}" or "${ModuleType.WEBVIEW}".`
        );
    }
  }

  async update(
    instanceId: string,
    type: ModuleType,
    updateModuleDto: UpdateModuleWebvncDto | UpdateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    const moduleList = await this.getModuleList(instanceId);

    switch (type) {
      case ModuleType.WEBVNC: {
        const dto = updateModuleDto as UpdateModuleWebvncDto;
        const existing = await this.prisma.moduleVnc.findUnique({ where: { moduleListId: moduleList.id } });
        if (!existing) throw new NotFoundException(`No webVnc module found for instance "${instanceId}"`);

        const updated = await this.prisma.moduleVnc.update({
          where: { moduleListId: moduleList.id },
          data: {
            loginUsers: dto.loginUsers as unknown as Prisma.JsonArray,
            vncDevices: dto.vncDevices as unknown as Prisma.JsonArray,
          },
        });
        return mapWebVnc(updated);
      }

      case ModuleType.WEBVIEW: {
        const dto = updateModuleDto as UpdateModuleWebviewDto;
        const existing = await this.prisma.moduleWebView.findUnique({ where: { moduleListId: moduleList.id } });
        if (!existing) throw new NotFoundException(`No webView module found for instance "${instanceId}"`);

        const updated = await this.prisma.moduleWebView.update({
          where: { moduleListId: moduleList.id },
          data: {
            loginUsers: dto.loginUsers as unknown as Prisma.JsonArray,
          },
        });
        return mapWebView(updated);
      }

      default:
        throw new BadRequestException(
          `Unknown module type "${type}". Expected "${ModuleType.WEBVNC}" or "${ModuleType.WEBVIEW}".`
        );
    }
  }

  async remove(instanceId: string, type: ModuleType): Promise<void> {
    const moduleList = await this.getModuleList(instanceId);

    switch (type) {
      case ModuleType.WEBVNC: {
        const existing = await this.prisma.moduleVnc.findUnique({ where: { moduleListId: moduleList.id } });
        if (!existing) throw new NotFoundException(`No webVnc module found for instance "${instanceId}"`);
        await this.prisma.moduleVnc.delete({ where: { moduleListId: moduleList.id } });
        return;
      }

      case ModuleType.WEBVIEW: {
        const existing = await this.prisma.moduleWebView.findUnique({ where: { moduleListId: moduleList.id } });
        if (!existing) throw new NotFoundException(`No webView module found for instance "${instanceId}"`);
        await this.prisma.moduleWebView.delete({ where: { moduleListId: moduleList.id } });
        return;
      }

      default:
        throw new BadRequestException(
          `Unknown module type "${type}". Expected "${ModuleType.WEBVNC}" or "${ModuleType.WEBVIEW}".`
        );
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Resolve ModuleList or throw 404 — shared by update() and remove(). */
  private async getModuleList(instanceId: string): Promise<ModuleList> {
    const moduleList = await this.prisma.moduleList.findUnique({
      where: { instanceId },
    });
    if (!moduleList) {
      throw new NotFoundException(`No ModuleList found for instance "${instanceId}"`);
    }
    return moduleList;
  }

  private async createWebVnc(
    moduleList: ModuleList,
    instance: { ipv4: string; subdomainValue: string; id: string },
    dto: CreateModuleWebvncDto
  ): Promise<ResponseModuleWebvncDto> {
    const existing = await this.prisma.moduleVnc.findUnique({ where: { moduleListId: moduleList.id } });
    if (existing) {
      throw new BadRequestException(`A webVnc module already exists for instance "${instance.id}"`);
    }

    const ipv4 = deriveWebVncIpv4(instance.ipv4);
    const subdomain = deriveModuleSubdomain(instance.subdomainValue, 'webvnc');

    await this.prisma.domain.upsert({
      where: { domain: subdomain },
      update: {},
      create: { domain: subdomain },
    });

    const created = await this.prisma.moduleVnc.create({
      data: {
        moduleListId: moduleList.id,
        ipv4,
        wireguardConfig: dto.wireguardConfig,
        subdomainValue: subdomain,
        version: MODULE_VERSION,
        loginUsers: dto.loginUsers as unknown as Prisma.JsonArray,
        vncDevices: dto.vncDevices as unknown as Prisma.JsonArray,
      },
    });

    return mapWebVnc(created);
  }

  private async createWebView(
    moduleList: ModuleList,
    instance: { ipv4: string; subdomainValue: string; id: string },
    dto: CreateModuleWebviewDto
  ): Promise<ResponseModuleWebviewDto> {
    const existing = await this.prisma.moduleWebView.findUnique({ where: { moduleListId: moduleList.id } });
    if (existing) {
      throw new BadRequestException(`A webView module already exists for instance "${instance.id}"`);
    }

    const ipv4 = deriveWebViewIpv4(instance.ipv4);
    const subdomain = deriveModuleSubdomain(instance.subdomainValue, 'webview');

    await this.prisma.domain.upsert({
      where: { domain: subdomain },
      update: {},
      create: { domain: subdomain },
    });

    const created = await this.prisma.moduleWebView.create({
      data: {
        moduleListId: moduleList.id,
        ipv4,
        wireguardConfig: dto.wireguardConfig,
        subdomainValue: subdomain,
        version: MODULE_VERSION,
        loginUsers: dto.loginUsers as unknown as Prisma.JsonArray,
      },
    });

    return mapWebView(created);
  }
}
