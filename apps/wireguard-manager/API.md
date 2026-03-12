# WireGuard Manager API Documentation

Base URL: `http://localhost:3000`

## Authentication

Most endpoints require a JWT token obtained from the `/auth/login` endpoint. Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST `/auth/login`

Login and receive JWT token.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

**Status Codes:**

- `200` - Login successful
- `401` - Invalid credentials
- `400` - Missing username or password

---

### POST `/auth/change-password`

Change user password (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**

```json
{
  "message": "Password changed successfully"
}
```

**Status Codes:**

- `200` - Password changed
- `401` - Unauthorized or incorrect current password
- `400` - Missing required fields

---

## Docker Endpoints

### GET `/docker/status`

Get Docker service status (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "running",
  "containers": 5,
  "images": 10
}
```

**Status Codes:**

- `200` - Status retrieved
- `401` - Unauthorized
- `503` - Docker connection failed

---

### POST `/docker/reload-nginx`

Reload Nginx proxy (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{}
```

**Response:**

```json
{
  "message": "Nginx reloaded successfully"
}
```

**Status Codes:**

- `200` - Nginx reloaded
- `401` - Unauthorized
- `500` - Reload failed

---

## WireGuard Endpoints

### GET `/wireguard/instances`

Get all WireGuard instances (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "instances": [
    {
      "id": "wg0",
      "status": "running",
      "peers": 5,
      "address": "10.0.0.1/24"
    }
  ]
}
```

**Status Codes:**

- `200` - Instances retrieved
- `401` - Unauthorized

---

### POST `/wireguard/create`

Create new WireGuard instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string",
  "subnet": "10.0.0.0/24"
}
```

**Response:**

```json
{
  "message": "WireGuard instance created",
  "instanceId": "wg0"
}
```

**Status Codes:**

- `201` - Instance created
- `401` - Unauthorized
- `400` - Invalid parameters
- `409` - Instance already exists

---

### POST `/wireguard/start`

Start WireGuard instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WireGuard instance started"
}
```

**Status Codes:**

- `200` - Instance started
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/wireguard/stop`

Stop WireGuard instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WireGuard instance stopped"
}
```

**Status Codes:**

- `200` - Instance stopped
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/wireguard/restart`

Restart WireGuard instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WireGuard instance restarted"
}
```

**Status Codes:**

- `200` - Instance restarted
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/wireguard/delete`

Delete WireGuard instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WireGuard instance deleted"
}
```

**Status Codes:**

- `200` - Instance deleted
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/wireguard/recreate`

Recreate WireGuard instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WireGuard instance recreated"
}
```

**Status Codes:**

- `200` - Instance recreated
- `401` - Unauthorized
- `404` - Instance not found

---

## WebVNC Endpoints

### POST `/webvnc/create`

Create new WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string",
  "port": "number"
}
```

**Response:**

```json
{
  "message": "WebVNC instance created",
  "instanceId": "webvnc0"
}
```

**Status Codes:**

- `201` - Instance created
- `401` - Unauthorized
- `400` - Invalid parameters

---

### POST `/webvnc/start`

Start WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WebVNC instance started"
}
```

**Status Codes:**

- `200` - Instance started
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webvnc/stop`

Stop WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WebVNC instance stopped"
}
```

**Status Codes:**

- `200` - Instance stopped
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webvnc/restart`

Restart WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WebVNC instance restarted"
}
```

**Status Codes:**

- `200` - Instance restarted
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webvnc/delete`

Delete WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WebVNC instance deleted"
}
```

**Status Codes:**

- `200` - Instance deleted
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webvnc/recreate`

Recreate WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string"
}
```

**Response:**

```json
{
  "message": "WebVNC instance recreated"
}
```

**Status Codes:**

- `200` - Instance recreated
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webvnc/users/add`

Add login user to WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string",
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "message": "User added successfully"
}
```

**Status Codes:**

- `200` - User added
- `401` - Unauthorized
- `400` - Missing required fields

---

### POST `/webvnc/users/remove`

Remove login user from WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string",
  "username": "string"
}
```

**Response:**

```json
{
  "message": "User removed successfully"
}
```

**Status Codes:**

- `200` - User removed
- `401` - Unauthorized
- `404` - User not found

---

### POST `/webvnc/devices/add`

Add VNC device to WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string",
  "deviceHost": "string",
  "devicePort": "number"
}
```

**Response:**

```json
{
  "message": "Device added successfully"
}
```

**Status Codes:**

- `200` - Device added
- `401` - Unauthorized
- `400` - Missing required fields

---

### POST `/webvnc/devices/remove`

Remove VNC device from WebVNC instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "instanceId": "string",
  "deviceId": "string"
}
```

**Response:**

```json
{
  "message": "Device removed successfully"
}
```

**Status Codes:**

- `200` - Device removed
- `401` - Unauthorized
- `404` - Device not found

---

### POST `/webvnc/users/changePassword`

Change VNC user password (no authentication required - third-party endpoint).

**Request Body:**

```json
{
  "instanceId": "string",
  "username": "string",
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Response:**

```json
{
  "message": "Password changed successfully"
}
```

**Status Codes:**

- `200` - Password changed
- `401` - Invalid credentials
- `400` - Missing required fields

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Environment Variables

The WireGuard Manager requires these environment variables:

- `ROOT_DOMAIN` - Root domain for SSL certificates
- `INIT_USERNAME` - Initial admin username
- `INIT_PASSWORD` - Initial admin password (min 12 characters)
- `CERTBOT_EMAIL` - Email for certificate notifications
- `JWT_SECRET` - Secret key for JWT signing
- `DATABASE_URL` - PostgreSQL connection string for WebView instances
- `PORT` - Server port (default: 3000)

---

## WebView Endpoints

### POST `/webview/create`

Create new WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string",
  "wireguardConfig": "string",
  "loginUsers": [
    {
      "username": "string",
      "password": "string",
      "role": "admin|user"
    }
  ]
}
```

**Response:**

```json
{
  "message": "WebView instance created successfully",
  "subdomain": "view.instancename"
}
```

**Status Codes:**

- `200` - Instance created
- `401` - Unauthorized
- `400` - Invalid parameters
- `404` - WireGuard instance not found
- `409` - WebView instance already exists

---

### POST `/webview/start`

Start WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string"
}
```

**Response:**

```json
{
  "message": "WebView instance started successfully"
}
```

**Status Codes:**

- `200` - Instance started
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webview/stop`

Stop WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string"
}
```

**Response:**

```json
{
  "message": "WebView instance stopped successfully"
}
```

**Status Codes:**

- `200` - Instance stopped
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webview/restart`

Restart WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string"
}
```

**Response:**

```json
{
  "message": "WebView instance restarted successfully"
}
```

**Status Codes:**

- `200` - Instance restarted
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webview/delete`

Delete WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string"
}
```

**Response:**

```json
{
  "message": "WebView instance deleted successfully"
}
```

**Status Codes:**

- `200` - Instance deleted
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webview/recreate`

Recreate WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string"
}
```

**Response:**

```json
{
  "message": "WebView instance recreated successfully"
}
```

**Status Codes:**

- `200` - Instance recreated
- `401` - Unauthorized
- `404` - Instance not found

---

### POST `/webview/users/add`

Add login user to WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string",
  "username": "string",
  "password": "string",
  "role": "admin|user"
}
```

**Response:**

```json
{
  "message": "Login user added successfully"
}
```

**Status Codes:**

- `200` - User added
- `401` - Unauthorized
- `400` - Missing required fields or invalid role

---

### POST `/webview/users/remove`

Remove login user from WebView instance (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "string",
  "username": "string"
}
```

**Response:**

```json
{
  "message": "Login user removed successfully"
}
```

**Status Codes:**

- `200` - User removed
- `401` - Unauthorized
- `400` - Missing required fields

---

### POST `/webview/users/changePassword`

Change WebView user password (no authentication required - third-party endpoint).

**Query Parameters:**

- `instance` - Instance name
- `username` - Username
- `changeToken` - Change token (provided during user creation)

**Request Body:**

```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Response:**

```json
{
  "message": "Password changed successfully"
}
```

**Status Codes:**

- `200` - Password changed
- `401` - Invalid credentials or expired token
- `400` - Missing required parameters

---

## Features

- **User Authentication** - JWT-based authentication
- **WireGuard Management** - Create, start, stop, restart, and delete WireGuard instances
- **WebVNC Management** - Manage VNC instances with user and device management
- **WebView Management** - Manage web dashboard instances with user roles (admin/user)
- **Docker Integration** - Monitor Docker status and manage Nginx proxy
- **Automatic SSL** - Weekly certificate renewal via Certbot
- **Service Management** - Automated service initialization and lifecycle management
- **Role-Based Access** - WebView users can have admin or user roles
