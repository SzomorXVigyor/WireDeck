/**
 * Types for WireGuard instance modules (WebView, WebVNC, etc.)
 */

// ---------------------------------------------------------------------------
// Shared sub-types
// ---------------------------------------------------------------------------

export interface ModuleUser {
  username: string;
  role?: string;
}

/** DTO for creating module user, role is optional password is required */
export type CreateModuleUserDto = Omit<ModuleUser, 'role'> & { password: string; role?: string };

// ---------------------------------------------------------------------------
// WebView module
// ---------------------------------------------------------------------------

/** Base shape for a WebView module as returned by the API. */
export interface InstanceModuleWebView {
  ipv4: string;
  loginUsers: ModuleUser[];
  subdomain: string;
  status: string;
  version: string;
  updatedAt: string;
  createdAt: string;
  [key: string]: any;
}

/** Fields accepted when creating a WebView module. */
export interface CreateInstanceModuleWebViewDto {
  wireguardConfig: string;
  loginUsers?: CreateModuleUserDto[];
}

/** Fields accepted when updating a WebView module (no config change). */
export interface UpdateInstanceModuleWebViewDto {
  loginUsers?: CreateModuleUserDto[];
}

// ---------------------------------------------------------------------------
// WebVNC module
// ---------------------------------------------------------------------------

export interface VncDevice {
  name: string;
  ip: string;
  port?: number;
  password?: string;
}

/** Base shape for a WebVNC module as returned by the API. */
export interface InstanceModuleWebVnc {
  ipv4: string;
  loginUsers: ModuleUser[];
  vncDevices: VncDevice[];
  subdomain: string;
  status: string;
  version: string;
  updatedAt: string;
  createdAt: string;
  [key: string]: any;
}

/** Fields accepted when creating a WebVNC module. */
export interface CreateInstanceModuleWebVncDto {
  wireguardConfig: string;
  loginUsers: CreateModuleUserDto[];
  vncDevices: VncDevice[];
}

/** Fields accepted when updating a WebVNC module (no config change). */
export interface UpdateInstanceModuleWebVncDto {
  loginUsers?: CreateModuleUserDto[];
  vncDevices?: VncDevice[];
}

// ---------------------------------------------------------------------------
// Module container
// ---------------------------------------------------------------------------

/** Aggregates all available modules on an instance. */
export interface InstanceModules {
  webView?: InstanceModuleWebView;
  webVNC?: InstanceModuleWebVnc;
  [key: string]: any;
}
