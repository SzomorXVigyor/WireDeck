import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';

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

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a module (webvnc | webview) for the given instance.
   * @param id    instance id
   * @param type  "webvnc" | "webview"
   */
  async create(
    id: string,
    type: string,
    createModuleDto: CreateModuleWebvncDto | CreateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    // Fetch instance to derive ip and subdomain
    const instance = await this.prisma.instance.findUnique({
      where: { id },
      include: { modules: true },
    });

    if (!instance) {
      throw new NotFoundException(`Instance "${id}" not found`);
    }

    if (!instance.modules) {
      throw new NotFoundException(`No ModuleList found for instance "${id}"`);
    }

    const moduleList = instance.modules;

    if (type === 'webvnc') {
      const dto = createModuleDto as CreateModuleWebvncDto;

      // Guard: only one webVnc per instance
      const existing = await this.prisma.moduleVnc.findUnique({
        where: { moduleListId: moduleList.id },
      });
      if (existing) {
        throw new BadRequestException(`A webVnc module already exists for instance "${id}"`);
      }

      // Derive server-side fields
      const ipv4 = deriveWebVncIpv4(instance.ipv4);
      const subdomain = deriveModuleSubdomain(instance.subdomainValue, 'webvnc');

      // Ensure Domain record exists for the subdomain FK
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

    if (type === 'webview') {
      const dto = createModuleDto as CreateModuleWebviewDto;

      // Guard: only one webView per instance
      const existing = await this.prisma.moduleWebView.findUnique({
        where: { moduleListId: moduleList.id },
      });
      if (existing) {
        throw new BadRequestException(`A webView module already exists for instance "${id}"`);
      }

      // Derive server-side fields
      const ipv4 = deriveWebViewIpv4(instance.ipv4);
      const subdomain = deriveModuleSubdomain(instance.subdomainValue, 'webview');

      // Ensure Domain record exists for the subdomain FK
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

    throw new BadRequestException(`Unknown module type "${type}". Expected "webvnc" or "webview".`);
  }

  /**
   * Update a module (webvnc | webview) for the given instance.
   * @param id    instanceId
   * @param type  "webvnc" | "webview"
   */
  async update(
    id: string,
    type: string,
    updateModuleDto: UpdateModuleWebvncDto | UpdateModuleWebviewDto
  ): Promise<ResponseModuleWebvncDto | ResponseModuleWebviewDto> {
    const moduleList = await this.prisma.moduleList.findUnique({
      where: { instanceId: id },
    });

    if (!moduleList) {
      throw new NotFoundException(`No ModuleList found for instance "${id}"`);
    }

    if (type === 'webvnc') {
      const dto = updateModuleDto as UpdateModuleWebvncDto;

      const existing = await this.prisma.moduleVnc.findUnique({
        where: { moduleListId: moduleList.id },
      });
      if (!existing) {
        throw new NotFoundException(`No webVnc module found for instance "${id}"`);
      }

      const updated = await this.prisma.moduleVnc.update({
        where: { moduleListId: moduleList.id },
        data: {
          loginUsers: dto.loginUsers as unknown as Prisma.JsonArray,
          vncDevices: dto.vncDevices as unknown as Prisma.JsonArray,
        },
      });

      return mapWebVnc(updated);
    }

    if (type === 'webview') {
      const dto = updateModuleDto as UpdateModuleWebviewDto;

      const existing = await this.prisma.moduleWebView.findUnique({
        where: { moduleListId: moduleList.id },
      });
      if (!existing) {
        throw new NotFoundException(`No webView module found for instance "${id}"`);
      }

      const updated = await this.prisma.moduleWebView.update({
        where: { moduleListId: moduleList.id },
        data: {
          loginUsers: dto.loginUsers as unknown as Prisma.JsonArray,
        },
      });

      return mapWebView(updated);
    }

    throw new BadRequestException(`Unknown module type "${type}". Expected "webvnc" or "webview".`);
  }

  /**
   * Remove a module by its own record id (ModuleVnc.id or ModuleWebView.id).
   * @param id    instanceId
   * @param type  "webvnc" | "webview"
   */
  async remove(id: string, type: string): Promise<void> {
    const moduleList = await this.prisma.moduleList.findUnique({
      where: { instanceId: id },
    });

    if (!moduleList) {
      throw new NotFoundException(`No ModuleList found for instance "${id}"`);
    }

    if (type === 'webvnc') {
      const existing = await this.prisma.moduleVnc.findUnique({
        where: { moduleListId: moduleList.id },
      });
      if (!existing) {
        throw new NotFoundException(`No webVnc module found for instance "${id}"`);
      }
      await this.prisma.moduleVnc.delete({ where: { moduleListId: moduleList.id } });
      return;
    }

    if (type === 'webview') {
      const existing = await this.prisma.moduleWebView.findUnique({
        where: { moduleListId: moduleList.id },
      });
      if (!existing) {
        throw new NotFoundException(`No webView module found for instance "${id}"`);
      }
      await this.prisma.moduleWebView.delete({ where: { moduleListId: moduleList.id } });
      return;
    }

    throw new BadRequestException(`Unknown module type "${type}". Expected "webvnc" or "webview".`);
  }
}
