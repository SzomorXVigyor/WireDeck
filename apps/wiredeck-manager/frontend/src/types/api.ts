/**
 * Barrel export for all API-related types.
 *
 * Import from this file instead of from the individual domain files
 * when you need types from multiple domains at once:
 *
 *   import type { Instance, CreateInstanceDto, ApiResponse } from '@/types/api';
 *
 * Or import directly from the domain file for single-domain usage:
 *
 *   import type { Instance } from '@/types/instance';
 */

export type * from './common';
export type * from './module';
export type * from './instance';
