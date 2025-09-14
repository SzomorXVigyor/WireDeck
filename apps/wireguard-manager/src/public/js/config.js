// Configuration and Global Variables
let instances = {};
let deleteModal;
let changePasswordModal;
let webvncModal;
let createWebvncModal;
let deleteWebVNCUserModal;
let deleteWebVNCDeviceModal;
let deleteWebVNCModal;

let currentDeleteInstance = null;
let currentWebvncInstance = null;
let currentCreateWebvncInstance = null;
let currentDeleteUser = { instance: null, username: null };
let currentDeleteDevice = { instance: null, deviceName: null };
let currentDeleteWebVNCInstance = null;

let dockerConnected = false;
let authToken = localStorage.getItem('authToken');
let currentUser = localStorage.getItem('currentUser');
let wireguardConfig = '';

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
};
