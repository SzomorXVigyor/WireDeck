/**
 * Types for WireGuard instances (the core resource of WireDeck).
 */

import type { InstanceModules } from './module';

// ---------------------------------------------------------------------------
// Base interface
// ---------------------------------------------------------------------------

/** Full representation of an Instance as returned by the API. */
export interface Instance {
  id: string;
  name: string;
  ipv4: string;
  publicPort: number;
  internal_ipv4Cidr: string;
  status: string;
  modules: InstanceModules;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/**
 * Payload for creating a new Instance.
 */
export interface CreateInstanceDto {
  name: string;
  cidr?: string;
  username: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/** Response wrapping a single Instance. */
export type InstanceResponse = Instance;

/** Response wrapping a list of Instances. */
export type InstancesResponse = Instance[];
