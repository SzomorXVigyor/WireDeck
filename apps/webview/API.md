# WireDeck - WebView API

Base URL: `/api`
All authenticated endpoints require `Authorization: Bearer <token>` header.
All request/response bodies are JSON.

Roles: `user`, `admin`. Admin-only endpoints are marked with [admin].


---


## Auth

### POST /api/auth/login
No auth required.

Request:
```json
{ "username": "admin", "password": "admin" }
```

Response 201:
```json
{
  "access_token": "<token>",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

Errors: 400 missing fields, 401 wrong credentials.

---

### GET /api/auth/profile
Returns the currently authenticated user.

Response 200:
```json
{ "user": { "id": 1, "username": "admin", "role": "admin" } }
```

---

### POST /api/auth/logout
Invalidates the current token.

Response 200:
```json
{ "message": "Logged out successfully" }
```

---

### POST /api/auth/changepassword
Returns a redirect URL to the password change page for the current user.
Only available when the service is configured as a WireDeck slave (`WIREDECK_SLAVE`, `PASS_CHANGE_URL`, and `SERVICE_NAME` env vars must be set).
The frontend should redirect the user to the returned URL.

Response 200:
```json
{ "redirectUrl": "https://master.example.com/changepassword?instance=my-service&username=admin&changeToken=<token>" }
```

Errors: 401 if password change is not configured, user not found, or user has no change token.


---


## Config

### GET /api/config
No auth required. Returns feature flags and environment info.

Response 200:
```json
{
  "features": { "passwordChange": true },
  "version": "1.0.0",
  "environment": "production"
}
```


---


## Health

### GET /api/health
No auth required.

Response 200:
```json
{
  "status": "ok",
  "timestamp": "2026-03-06T12:00:00.000Z",
  "environment": {
    "users": 2,
    "wireguard": { "status": "connected", "details": "..." }
  }
}
```


---


## Views

A View is a named dashboard page containing a list of cards (components).

### GET /api/views
Returns the view list (id + name only).

Response 200:
```json
[
  { "id": 1, "name": "Power Control" },
  { "id": 2, "name": "Temperature & Climate" }
]
```

---

### GET /api/view/:id
Returns a full view with all cards.

Response 200:
```json
{
  "id": 1,
  "name": "Power Control",
  "layout": { "type": "fill", "updateInterval": 5 },
  "components": [
    {
      "id": 1,
      "name": "Main Switch",
      "type": "button",
      "order": 1,
      "register": 1,
      "style": { "color": "primary", "size": "md" },
      "extra": { "label": "Toggle Power", "confirmAction": true }
    }
  ]
}
```

Card types: `button`, `switch`, `display`, `number_input`.
`register` references a RegisterDictEntry id (see Register Dictionary).
`layout.updateInterval` is the polling interval in seconds (0 = no polling).

Errors: 404 not found.

---

### POST /api/view/new [admin]
Creates a new empty view with a generated name.

Response 201: full view object (same shape as GET /api/view/:id).

---

### PUT /api/view/:id [admin]
Replaces the full view. Send the complete view object.

Request body: same shape as GET /api/view/:id response.

Response 200: updated view object.

Errors: 404 not found.

---

### DELETE /api/view/:id [admin]
Deletes a view.

Response 204 No Content.

Errors: 404 not found.


---


## View Data (live register values)

### GET /api/view/:id/data
Returns the current register values for all cards in the view.
Call this on the polling interval defined in `layout.updateInterval`.

Response 200:
```json
[
  { "register": 1, "value": 0 },
  { "register": 2, "value": 1 },
  { "register": 3, "value": 14.72 }
]
```

Errors: 404 view not found.

---

### POST /api/view/:id/data
Writes a single register value (button press, switch toggle, number-input change).

Request:
```json
{ "register": 2, "value": 1 }
```

Response 200:
```json
{ "register": 2, "value": 1 }
```

Errors: 400 missing fields, 404 view not found or register not part of view.


---


## Devices

A Device represents a physical field device (e.g. PLC, HVAC controller).
Devices are referenced by RegisterDictEntry.deviceId.

### GET /api/devices
Returns all devices.

Response 200:
```json
[
  { "id": 1, "name": "PLC-1",  "ip": "192.168.1.10", "port": 502, "protocol": "ModbusTCP" },
  { "id": 2, "name": "HVAC-1", "ip": "192.168.1.20", "port": 502, "protocol": "ModbusTCP" }
]
```

Supported protocols: `ModbusTCP`.

---

### POST /api/device/new [admin]
Creates a new device.

Request:
```json
{ "name": "PLC-2", "ip": "192.168.1.30", "port": 502, "protocol": "ModbusTCP" }
```

Response 201: device object with assigned `id`.

Errors: 400 missing fields.

---

### PUT /api/device/:id [admin]
Replaces a device entry.

Request: same shape as POST body.

Response 200: updated device object.

Errors: 404 not found.

---

### DELETE /api/device/:id [admin]
Deletes a device.

Response 204 No Content.

Errors: 404 not found.


---


## Register Dictionary

A RegisterDictEntry maps a human-readable name to a physical register on a device.
`card.register` stores the RegisterDictEntry `id`.

### GET /api/registers
Returns all register entries.

Response 200:
```json
[
  {
    "id": 1,
    "name": "Main Switch Command",
    "deviceId": 1,
    "protocolAttributes": {
      "slaveAddress": 1,
      "registerType": "coil",
      "registerAddress": 100,
      "operation": "RW"
    }
  }
]
```

registerType values: `coil`, `discrete-input`, `holding-register`, `input-register`.
operation values: `R`, `W`, `RW`.

---

### POST /api/register/new [admin]
Creates a new register entry.

Request:
```json
{
  "name": "Motor Speed",
  "deviceId": 1,
  "protocolAttributes": {
    "slaveAddress": 1,
    "registerType": "holding-register",
    "registerAddress": 110,
    "operation": "RW"
  }
}
```

Response 201: register entry with assigned `id`.

Errors: 400 missing fields.

---

### PUT /api/register/:id [admin]
Replaces a register entry.

Request: same shape as POST body.

Response 200: updated register entry.

Errors: 404 not found.

---

### DELETE /api/register/:id [admin]
Deletes a register entry.

Response 204 No Content.

Errors: 404 not found.


---


## Error format

All error responses use:
```json
{ "message": "Human readable error description" }
```

Common status codes:
- 400 Bad Request — missing or invalid fields
- 401 Unauthorized — missing or invalid token
- 403 Forbidden — authenticated but insufficient role
- 404 Not Found — resource does not exist
- 204 No Content — successful delete (no body)
