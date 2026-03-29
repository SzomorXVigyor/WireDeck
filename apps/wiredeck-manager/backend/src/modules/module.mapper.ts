import { ModuleVnc, ModuleWebView, Prisma } from '@prisma/client';
import { ResponseModuleWebvncDto, ResponseVncDeviceDto } from './dto/response-module-webvnc.dto';
import { ResponseModuleWebviewDto } from './dto/response-module-webview.dto';
import { ModuleUserRole } from './entities/module-user.entity';
import { MODULE_WEBVNC_PREFERED_NETWORK_ID, MODULE_WEBVIEW_PREFERED_NETWORK_ID } from 'src/utils/env';

// ---------------------------------------------------------------------------
// Raw JSON shapes stored in the Json Prisma columns
// ---------------------------------------------------------------------------

export interface RawModuleUser {
  username: string;
  password?: string;
  changeToken?: string;
  role?: string;
}

export interface RawVncDevice {
  name: string;
  ip: string;
  port: number;
  password?: string;
}

// ---------------------------------------------------------------------------
// IP / subdomain / version derivation helpers
// ---------------------------------------------------------------------------

/**
 * Replaces the 3rd octet of the given IPv4 with the module network id from env.
 * Example: instanceIp = "10.0.0.5", networkId = "1" → "10.0.1.5"
 */
function deriveModuleIpv4(instanceIpv4: string, networkId: string): string {
  const octets = instanceIpv4.split('.');
  octets[2] = networkId;
  return octets.join('.');
}

/**
 * Derives the module subdomain by prepending the module type label to the
 * instance's subdomain.
 * Example: instanceSubdomain = "my-instance.example.com", label = "webvnc"
 */
export function deriveModuleSubdomain(instanceSubdomain: string, label: string): string {
  return `${label}.${instanceSubdomain}`;
}

/** Current hardcoded module version. Can be promoted to an env-var later. */
export const MODULE_VERSION = '1.0.0';

/** Convenience wrappers that apply the correct env-based network id per type. */
export function deriveWebVncIpv4(instanceIpv4: string): string {
  return deriveModuleIpv4(instanceIpv4, MODULE_WEBVNC_PREFERED_NETWORK_ID);
}

export function deriveWebViewIpv4(instanceIpv4: string): string {
  return deriveModuleIpv4(instanceIpv4, MODULE_WEBVIEW_PREFERED_NETWORK_ID);
}

// ---------------------------------------------------------------------------
// Response-DTO mapping helpers
// ---------------------------------------------------------------------------

export function mapLoginUsers(raw: Prisma.JsonValue) {
  const users = raw as unknown as RawModuleUser[];
  return (users ?? []).map((u) => ({
    username: u.username,
    ...(u.role !== undefined && { role: u.role as ModuleUserRole }),
  }));
}

export function mapVncDevices(raw: Prisma.JsonValue): ResponseVncDeviceDto[] {
  const devices = raw as unknown as RawVncDevice[];
  return (devices ?? []).map((d) => ({
    name: d.name,
    ip: d.ip,
    port: d.port,
  }));
}

export function mapWebView(model: ModuleWebView): ResponseModuleWebviewDto {
  return {
    ipv4: model.ipv4,
    subdomain: model.subdomainValue,
    status: 'unknown',
    version: model.version,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    loginUsers: mapLoginUsers(model.loginUsers),
  };
}

export function mapWebVnc(model: ModuleVnc): ResponseModuleWebvncDto {
  return {
    ipv4: model.ipv4,
    subdomain: model.subdomainValue,
    status: 'unknown',
    version: model.version,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    loginUsers: mapLoginUsers(model.loginUsers),
    vncDevices: mapVncDevices(model.vncDevices),
  };
}
