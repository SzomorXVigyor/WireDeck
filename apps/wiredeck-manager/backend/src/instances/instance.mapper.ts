import { Prisma } from '@prisma/client';
import { ResponseModuleUserDto } from 'src/modules/dto/response-module-user.dto';
import { ResponseModuleWebviewDto } from 'src/modules/dto/response-module-webview.dto';
import { ResponseModuleWebvncDto, ResponseVncDeviceDto } from 'src/modules/dto/response-module-webvnc.dto';
import { ModuleUserRole } from 'src/modules/entities/module-user.entity';
import { ResponseInstanceDto, ResponseInstanceModulesDto } from './dto/response-instance.dto';

// ---------------------------------------------------------------------------
// Prisma payload types — derived from the exact include shape used in queries
// ---------------------------------------------------------------------------

export const instanceInclude = {
  modules: {
    include: {
      webView: true,
      webVnc: true,
    },
  },
} satisfies Prisma.InstanceInclude;

export type PrismaInstanceWithModules = Prisma.InstanceGetPayload<{
  include: typeof instanceInclude;
}>;

type PrismaModuleList = NonNullable<PrismaInstanceWithModules['modules']>;
type PrismaModuleWebView = NonNullable<PrismaModuleList['webView']>;
type PrismaModuleVnc = NonNullable<PrismaModuleList['webVnc']>;

// ---------------------------------------------------------------------------
// Raw JSON shapes stored in the Json Prisma columns
// ---------------------------------------------------------------------------

interface RawModuleUser {
  username: string;
  password?: string;
  changeToken?: string;
  role?: string;
}

interface RawVncDevice {
  name: string;
  ip: string;
  port: number;
  password?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapLoginUsers(raw: Prisma.JsonValue): ResponseModuleUserDto[] {
  const users = raw as unknown as RawModuleUser[];
  return (users ?? []).map((u) => ({
    username: u.username,
    ...(u.role !== undefined && { role: u.role as ModuleUserRole }),
  }));
}

function mapVncDevices(raw: Prisma.JsonValue): ResponseVncDeviceDto[] {
  const devices = raw as unknown as RawVncDevice[];
  return (devices ?? []).map((d) => ({
    name: d.name,
    ip: d.ip,
    port: d.port,
  }));
}

function mapWebView(model: PrismaModuleWebView): ResponseModuleWebviewDto {
  return {
    ipv4: model.ipv4,
    subdomain: model.subdomainValue,
    version: model.version,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    loginUsers: mapLoginUsers(model.loginUsers),
  };
}

function mapWebVnc(model: PrismaModuleVnc): ResponseModuleWebvncDto {
  return {
    ipv4: model.ipv4,
    subdomain: model.subdomainValue,
    version: model.version,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    loginUsers: mapLoginUsers(model.loginUsers),
    vncDevices: mapVncDevices(model.vncDevices),
  };
}

function mapModules(modules: PrismaModuleList | null | undefined): ResponseInstanceModulesDto {
  return {
    webView: modules?.webView ? mapWebView(modules.webView) : null,
    webVNC: modules?.webVnc ? mapWebVnc(modules.webVnc) : null,
  };
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------

export function mapInstanceToResponse(model: PrismaInstanceWithModules): ResponseInstanceDto {
  return {
    id: model.id,
    name: model.name,
    ipv4: model.ipv4,
    publicPort: model.publicPort,
    internal_ipv4Cidr: model.internal_ipv4Cidr,
    subdomain: model.subdomainValue,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    modules: mapModules(model.modules),
  };
}
