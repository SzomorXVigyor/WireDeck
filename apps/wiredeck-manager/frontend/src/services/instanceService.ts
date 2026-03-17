import api from './api';
import type { Instance, InstancesResponse, CreateInstanceDto } from '../types/api';
import type { ApiResponse } from '../types/common';
import type {
  CreateInstanceModuleWebViewDto,
  CreateInstanceModuleWebVncDto,
  UpdateInstanceModuleWebViewDto,
  UpdateInstanceModuleWebVncDto,
} from '../types/module';

export type InstanceAction = 'start' | 'stop' | 'restart' | 'recreate';
export type ModuleType = 'webVNC' | 'webView';

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Fetch all instances. */
export async function fetchInstances(): Promise<Instance[]> {
  const res = await api.get<InstancesResponse>('/instances');
  return res.data;
}

// ---------------------------------------------------------------------------
// Write — Instance lifecycle
// ---------------------------------------------------------------------------

/** Create a new WireGuard instance. */
export async function createInstance(payload: CreateInstanceDto): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>('/instance/create', payload);
  return res.data;
}

/** Delete an instance by id. */
export async function deleteInstance(instanceId: string): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>('/instance/delete', {}, { params: { id: instanceId } });
  return res.data;
}

/** Trigger a lifecycle action (start / stop / restart / recreate) on an instance. */
export async function instanceAction(action: InstanceAction, instanceId: string): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>(`/instance/${action}`, {}, { params: { id: instanceId } });
  return res.data;
}

// ---------------------------------------------------------------------------
// Write — Module lifecycle
// ---------------------------------------------------------------------------

/** Create a WebView module. Sends to POST /instance/module/create?id=<id>&type=webview */
export async function createWebViewModule(
  instanceId: string,
  dto: CreateInstanceModuleWebViewDto
): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>('/instance/module/create', dto, {
    params: { id: instanceId, type: 'webview' },
  });
  return res.data;
}

/** Create a WebVNC module. Sends to POST /instance/module/create?id=<id>&type=webvnc */
export async function createWebVncModule(instanceId: string, dto: CreateInstanceModuleWebVncDto): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>('/instance/module/create', dto, {
    params: { id: instanceId, type: 'webvnc' },
  });
  return res.data;
}

/** Update a WebView module. Sends to POST /instance/module/update?id=<id>&type=webview */
export async function updateWebViewModule(
  instanceId: string,
  dto: UpdateInstanceModuleWebViewDto
): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>('/instance/module/update', dto, {
    params: { id: instanceId, type: 'webview' },
  });
  return res.data;
}

/** Update a WebVNC module. Sends to POST /instance/module/update?id=<id>&type=webvnc */
export async function updateWebVncModule(instanceId: string, dto: UpdateInstanceModuleWebVncDto): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>('/instance/module/update', dto, {
    params: { id: instanceId, type: 'webvnc' },
  });
  return res.data;
}

/** Trigger a lifecycle action on a specific module. */
export async function moduleAction(
  instanceId: string,
  moduleType: ModuleType,
  action: InstanceAction
): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>(
    '/instance/module/action',
    { action },
    {
      params: { id: instanceId, type: moduleType === 'webVNC' ? 'webvnc' : 'webview' },
    }
  );
  return res.data;
}

/** Delete a module from an instance. */
export async function deleteModule(instanceId: string, moduleType: ModuleType): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>(
    '/instance/module/delete',
    {},
    {
      params: { id: instanceId, type: moduleType === 'webVNC' ? 'webvnc' : 'webview' },
    }
  );
  return res.data;
}
