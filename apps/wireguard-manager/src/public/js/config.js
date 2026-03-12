// Configuration and Global Variables
let instances = {};
let deleteModal;
let changePasswordModal;
let webvncModal;
let createWebvncModal;
let deleteWebVNCUserModal;
let deleteWebVNCDeviceModal;
let deleteWebVNCModal;
let webviewModal;
let createWebviewModal;
let deleteWebViewUserModal;
let deleteWebViewModal;

let currentDeleteInstance = null;
let currentWebvncInstance = null;
let currentCreateWebvncInstance = null;
let currentDeleteUser = { instance: null, username: null };
let currentDeleteDevice = { instance: null, deviceName: null };
let currentDeleteWebVNCInstance = null;
let currentWebviewInstance = null;
let currentCreateWebviewInstance = null;
let currentDeleteWebViewUser = { instance: null, username: null };
let currentDeleteWebViewInstance = null;

let dockerConnected = false;
let authToken = localStorage.getItem('authToken');
let currentUser = localStorage.getItem('currentUser');
let wireguardConfig = '';
let webviewWireguardConfig = '';

// API Endpoints
const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    changePassword: '/auth/change-password',
  },
  docker: {
    status: '/docker/status',
  },
  wireguard: {
    instances: '/wireguard/instances',
    create: '/wireguard/create',
    start: '/wireguard/start',
    stop: '/wireguard/stop',
    restart: '/wireguard/restart',
    delete: '/wireguard/delete',
    recreate: '/wireguard/recreate',
  },
  webvnc: {
    instance: '/webvnc/instance',
    create: '/webvnc/create',
    start: '/webvnc/start',
    stop: '/webvnc/stop',
    restart: '/webvnc/restart',
    delete: '/webvnc/delete',
    recreate: '/webvnc/recreate',
    users: {
      add: '/webvnc/users/add',
      remove: '/webvnc/users/remove',
    },
    devices: {
      add: '/webvnc/devices/add',
      remove: '/webvnc/devices/remove',
    },
  },
  webview: {
    create: '/webview/create',
    start: '/webview/start',
    stop: '/webview/stop',
    restart: '/webview/restart',
    delete: '/webview/delete',
    recreate: '/webview/recreate',
    users: {
      add: '/webview/users/add',
      remove: '/webview/users/remove',
    },
  },
};
