import { Prisma } from '@prisma/client';
import { ResponseInstanceDto, ResponseInstanceModulesDto } from './dto/response-instance.dto';
import { mapWebVnc, mapWebView } from 'src/modules/module.mapper';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    status: 'unknown',
    subdomain: model.subdomainValue,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    modules: mapModules(model.modules),
  };
}
