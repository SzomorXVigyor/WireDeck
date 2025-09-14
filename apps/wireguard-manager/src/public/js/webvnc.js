// WebVNC Management Functions
function showCreateWebVNCModal(instanceName) {
  currentCreateWebvncInstance = instanceName;
  document.getElementById('createWebvncInstanceName').textContent = instanceName;

  // Reset form
  document.getElementById('createWebvncForm').reset();
  document.getElementById('loginUsersContainer').innerHTML = '';
  document.getElementById('vncDevicesContainer').innerHTML = '';
  document.getElementById('configPreview').style.display = 'none';
  wireguardConfig = '';

  createWebvncModal.show();
}

async function showWebVNCModal(instanceName) {
  currentWebvncInstance = instanceName;
  document.getElementById('webvncInstanceName').textContent = instanceName;

  webvncModal.show();

  // Use data from instances instead of making separate API call
  const instance = instances[instanceName];
  if (instance && instance.remoteVNC) {
    renderWebVNCContent(instance.remoteVNC);
  } else {
    document.getElementById('webvncContent').innerHTML = '<div class="alert alert-danger">WebVNC not configured for this instance</div>';
  }
}

function renderWebVNCContent(webvncData) {
  const contentDiv = document.getElementById('webvncContent');
  const isOnline = webvncData.status === 'online';

  let html = `
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h6>WebVNC Status</h6>
                <span class="badge bg-${isOnline ? 'success' : 'warning'}">
                    <i class="fas fa-${isOnline ? 'check-circle' : 'pause-circle'} me-1"></i>
                    ${isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
            ${
              isOnline
                ? `
                <div class="mt-2">
                    <a href="https://${webvncData.subdomain}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt me-1"></i>Open WebVNC
                    </a>
                </div>
            `
                : ''
            }
        </div>

        <div class="mb-3">
            <h6>Instance Controls</h6>
            <div class="btn-group" role="group">
                <button class="btn btn-sm ${isOnline ? 'btn-warning' : 'btn-success'}" onclick="${isOnline ? 'stopWebVNC' : 'startWebVNC'}('${currentWebvncInstance}')">
                    <i class="fas fa-${isOnline ? 'stop' : 'play'} me-1"></i>${isOnline ? 'Stop' : 'Start'}
                </button>
                <button class="btn btn-sm btn-info" onclick="restartWebVNC('${currentWebvncInstance}')" ${!isOnline ? 'disabled' : ''}>
                    <i class="fas fa-redo me-1"></i>Restart
                </button>
                <button class="btn btn-sm btn-secondary" onclick="recreateWebVNC('${name}')">
                    <i class="fas fa-gears me-1"></i>Recreate
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteWebVNC('${currentWebvncInstance}')">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        </div>

        <div class="mb-3">
            <h6>Login Users (${webvncData.loginUsers ? webvncData.loginUsers.length : 0})</h6>
            <div class="mb-2">
    `;

  if (webvncData.loginUsers && webvncData.loginUsers.length > 0) {
    webvncData.loginUsers.forEach((user) => {
      html += `
                <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-1">
                    <span><i class="fas fa-user me-2"></i>${user.username}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmRemoveWebVNCUser('${currentWebvncInstance}', '${user.username}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
    });
  } else {
    html += '<p class="text-muted small">No login users configured</p>';
  }

  html += `
            </div>
            <button class="btn btn-sm btn-outline-primary" onclick="showAddUserForm()">
                <i class="fas fa-plus me-1"></i>Add User
            </button>
        </div>

        <div class="mb-3">
            <h6>VNC Devices (${webvncData.vncDevices ? webvncData.vncDevices.length : 0})</h6>
            <div class="mb-2">
    `;

  if (webvncData.vncDevices && webvncData.vncDevices.length > 0) {
    webvncData.vncDevices.forEach((device) => {
      html += `
                <div class="border rounded p-2 mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span><strong>${device.name}</strong></span>
                        <button class="btn btn-sm btn-outline-danger" onclick="confirmRemoveWebVNCDevice('${currentWebvncInstance}', '${device.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <small class="text-muted">
                        <i class="fas fa-network-wired me-1"></i>${device.ip}:${device.port}
                    </small>
                </div>
            `;
    });
  } else {
    html += '<p class="text-muted small">No VNC devices configured</p>';
  }

  html += `
            </div>
            <button class="btn btn-sm btn-outline-success" onclick="showAddDeviceForm()">
                <i class="fas fa-plus me-1"></i>Add Device
            </button>
        </div>

        <div id="addUserForm" style="display: none;" class="mb-3">
            <h6>Add Login User</h6>
            <div class="row g-2">
                <div class="col-6">
                    <input type="text" class="form-control" id="newUsername" placeholder="Username">
                </div>
                <div class="col-6">
                    <input type="password" class="form-control" id="newUserPassword" placeholder="Password">
                </div>
                <div class="col-12">
                    <button class="btn btn-sm btn-primary me-2" onclick="addWebVNCUser()">
                        <i class="fas fa-plus me-1"></i>Add
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="hideAddUserForm()">Cancel</button>
                </div>
            </div>
        </div>

        <div id="addDeviceForm" style="display: none;" class="mb-3">
            <h6>Add VNC Device</h6>
            <div class="row g-2">
                <div class="col-6">
                    <input type="text" class="form-control" id="newDeviceName" placeholder="Device Name">
                </div>
                <div class="col-6">
                    <input type="text" class="form-control" id="newDeviceIp" placeholder="IP Address">
                </div>
                <div class="col-6">
                    <input type="number" class="form-control" id="newDevicePort" placeholder="Port" value="5900">
                </div>
                <div class="col-6">
                    <input type="password" class="form-control" id="newDevicePassword" placeholder="Password (Optional)">
                </div>
                <div class="col-12">
                    <button class="btn btn-sm btn-success me-2" onclick="addWebVNCDevice()">
                        <i class="fas fa-plus me-1"></i>Add
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="hideAddDeviceForm()">Cancel</button>
                </div>
            </div>
        </div>
    `;

  contentDiv.innerHTML = html;
}

async function createWebVNC() {
  if (!wireguardConfig) {
    showToast('Please upload a WireGuard configuration file', 'error');
    return;
  }

  // Collect login users
  const loginUsers = [];
  const userContainers = document.querySelectorAll('#loginUsersContainer > div');
  userContainers.forEach((container) => {
    const username = container.querySelector('[data-field="username"]').value;
    const password = container.querySelector('[data-field="password"]').value;
    if (username && password) {
      loginUsers.push({ username, password });
    }
  });

  // Fixed VNC devices collection - target the correct container
  const vncDevices = [];
  const deviceContainers = document.querySelectorAll('#vncDevicesContainer .border.rounded');
  deviceContainers.forEach((container) => {
    const name = container.querySelector('[data-field="name"]').value;
    const ip = container.querySelector('[data-field="ip"]').value;
    const port = container.querySelector('[data-field="port"]').value || 5900;

    if (name && ip && port) {
      vncDevices.push({
        name,
        ip,
        port: parseInt(port),
      });
    }
  });

  const confirmBtn = document.getElementById('confirmCreateWebvncBtn');
  const originalText = confirmBtn.innerHTML;

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';

  try {
    const response = await fetch(API_ENDPOINTS.webvnc.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: currentCreateWebvncInstance,
        wireguardConfig,
        loginUsers,
        vncDevices,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`WebVNC instance created successfully!`, 'success');
      createWebvncModal.hide();
      await loadInstances();
    } else {
      throw new Error(result.error || 'Creation failed');
    }
  } catch (error) {
    console.error('Error creating WebVNC:', error);
    showToast(`Failed to create WebVNC: ${error.message}`, 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalText;
  }
}

// WebVNC Control Functions
async function startWebVNC(name) {
  await webvncAction('start', name);
}

async function stopWebVNC(name) {
  await webvncAction('stop', name);
}

async function restartWebVNC(name) {
  await webvncAction('restart', name);
}

async function recreateWebVNC(name) {
  await webvncAction('recreate', name);
}

async function deleteWebVNC(name) {
  try {
    const response = await fetch(API_ENDPOINTS.webvnc.delete, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('WebVNC instance deleted successfully!', 'success');
      await loadInstances();
    } else {
      throw new Error(result.error || 'Failed to delete WebVNC');
    }
  } catch (error) {
    console.error('Error deleting WebVNC:', error);
    showToast(`Failed to delete WebVNC: ${error.message}`, 'error');
  }
}

async function webvncAction(action, name) {
  try {
    const response = await fetch(API_ENDPOINTS.webvnc[action], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`WebVNC ${action}ed successfully!`, 'success');
      if (currentWebvncInstance === name) {
        await loadInstances(); // Refresh instances data
        showWebVNCModal(name); // Refresh modal content
      }
    } else {
      throw new Error(result.error || `${action} failed`);
    }
  } catch (error) {
    console.error(`Error ${action}ing WebVNC:`, error);
    showToast(`Failed to ${action} WebVNC: ${error.message}`, 'error');
  }
}

// WebVNC User Management
function showAddUserForm() {
  document.getElementById('addUserForm').style.display = 'block';
}

function hideAddUserForm() {
  document.getElementById('addUserForm').style.display = 'none';
  document.getElementById('newUsername').value = '';
  document.getElementById('newUserPassword').value = '';
}

async function addWebVNCUser() {
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newUserPassword').value;

  if (!username || !password) {
    showToast('Please enter both username and password', 'error');
    return;
  }

  try {
    const response = await fetch(API_ENDPOINTS.webvnc.users.add, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: currentWebvncInstance,
        username,
        password,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('User added successfully!', 'success');
      hideAddUserForm();
      await loadInstances(); // Refresh instances data
      showWebVNCModal(currentWebvncInstance); // Refresh modal
    } else {
      throw new Error(result.error || 'Failed to add user');
    }
  } catch (error) {
    console.error('Error adding user:', error);
    showToast(`Failed to add user: ${error.message}`, 'error');
  }
}

async function removeWebVNCUser(instanceName, username) {
  try {
    const response = await fetch(API_ENDPOINTS.webvnc.users.remove, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: instanceName,
        username,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('User removed successfully!', 'success');
      await loadInstances(); // Refresh instances data
      showWebVNCModal(instanceName); // Refresh modal
    } else {
      throw new Error(result.error || 'Failed to remove user');
    }
  } catch (error) {
    console.error('Error removing user:', error);
    showToast(`Failed to remove user: ${error.message}`, 'error');
  }
}

// WebVNC Device Management
function showAddDeviceForm() {
  document.getElementById('addDeviceForm').style.display = 'block';
}

function hideAddDeviceForm() {
  document.getElementById('addDeviceForm').style.display = 'none';
  document.getElementById('newDeviceName').value = '';
  document.getElementById('newDeviceIp').value = '';
  document.getElementById('newDevicePort').value = '5900';
  document.getElementById('newDevicePassword').value = '';
}

async function addWebVNCDevice() {
  const name = document.getElementById('newDeviceName').value;
  const ip = document.getElementById('newDeviceIp').value;
  const port = document.getElementById('newDevicePort').value;
  const password = document.getElementById('newDevicePassword').value;

  if (!name || !ip || !port) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    const response = await fetch(API_ENDPOINTS.webvnc.devices.add, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: currentWebvncInstance,
        device: {
          name,
          ip,
          port: parseInt(port),
          password,
          // Removed path - will be auto-calculated on backend
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('Device added successfully!', 'success');
      hideAddDeviceForm();
      await loadInstances(); // Refresh instances data
      showWebVNCModal(currentWebvncInstance); // Refresh modal
    } else {
      throw new Error(result.error || 'Failed to add device');
    }
  } catch (error) {
    console.error('Error adding device:', error);
    showToast(`Failed to add device: ${error.message}`, 'error');
  }
}

async function removeWebVNCDevice(instanceName, deviceName) {
  try {
    const response = await fetch(API_ENDPOINTS.webvnc.devices.remove, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: instanceName,
        deviceName,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('Device removed successfully!', 'success');
      await loadInstances(); // Refresh instances data
      showWebVNCModal(instanceName); // Refresh modal
    } else {
      throw new Error(result.error || 'Failed to remove device');
    }
  } catch (error) {
    console.error('Error removing device:', error);
    showToast(`Failed to remove device: ${error.message}`, 'error');
  }
}

// Confirmation functions
function confirmRemoveWebVNCUser(instanceName, username) {
  currentDeleteUser = { instance: instanceName, username: username };
  document.getElementById('deleteWebVNCUserName').textContent = username;
  document.getElementById('deleteWebVNCUserInstance').textContent = instanceName;
  deleteWebVNCUserModal.show();
}

function confirmRemoveWebVNCDevice(instanceName, deviceName) {
  currentDeleteDevice = { instance: instanceName, deviceName: deviceName };
  document.getElementById('deleteWebVNCDeviceName').textContent = deviceName;
  document.getElementById('deleteWebVNCDeviceInstance').textContent = instanceName;
  deleteWebVNCDeviceModal.show();
}

function confirmDeleteWebVNC(instanceName) {
  currentDeleteWebVNCInstance = instanceName;
  document.getElementById('deleteWebVNCInstanceName').textContent = instanceName;
  deleteWebVNCModal.show();
}

// File upload functions
function setupFileUpload() {
  const uploadArea = document.getElementById('configUploadArea');
  const fileInput = document.getElementById('configFileInput');

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });
}

function handleFileUpload(file) {
  if (!file.name.endsWith('.conf')) {
    showToast('Please select a valid .conf file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    wireguardConfig = e.target.result;
    document.getElementById('configContent').textContent = wireguardConfig;
    document.getElementById('configPreview').style.display = 'block';
  };
  reader.readAsText(file);
}

function addLoginUserField() {
  const container = document.getElementById('loginUsersContainer');
  const index = container.children.length;

  const userHtml = `
        <div class="row g-2 mb-2" id="loginUser${index}">
            <div class="col-5">
                <input type="text" class="form-control" placeholder="Username" data-field="username" required>
            </div>
            <div class="col-5">
                <input type="password" class="form-control" placeholder="Password" data-field="password" required>
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-outline-danger w-100" onclick="removeLoginUserField(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

  container.insertAdjacentHTML('beforeend', userHtml);
}

function removeLoginUserField(index) {
  const element = document.getElementById(`loginUser${index}`);
  if (element) element.remove();
}

function addVncDeviceField() {
  const container = document.getElementById('vncDevicesContainer');
  const index = container.children.length;

  const deviceHtml = `
        <div class="border rounded p-3 mb-3" id="vncDevice${index}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">VNC Device #${index + 1}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeVncDeviceField(${index})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="row g-2">
                <div class="col-md-6">
                    <label class="form-label">Device Name *</label>
                    <input type="text" class="form-control" placeholder="e.g., Desktop-1" data-field="name" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">IP Address *</label>
                    <input type="text" class="form-control" placeholder="e.g., 192.168.1.100" data-field="ip" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Port *</label>
                    <input type="number" class="form-control" placeholder="5900" data-field="port" min="1" max="65535" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Password (Optional)</label>
                    <input type="password" class="form-control" placeholder="VNC Password" data-field="password">
                </div>
            </div>
        </div>
    `;

  container.insertAdjacentHTML('beforeend', deviceHtml);
}

function removeVncDeviceField(index) {
  const element = document.getElementById(`vncDevice${index}`);
  if (element) element.remove();
}

function setupWebVNCDeleteConfirmations() {
  // WebVNC User deletion
  document.getElementById('confirmDeleteWebVNCUserBtn').addEventListener('click', async () => {
    if (!currentDeleteUser.instance || !currentDeleteUser.username) return;

    const confirmBtn = document.getElementById('confirmDeleteWebVNCUserBtn');
    const originalText = confirmBtn.innerHTML;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Removing...';

    try {
      await removeWebVNCUser(currentDeleteUser.instance, currentDeleteUser.username);
      deleteWebVNCUserModal.hide();
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
      currentDeleteUser = { instance: null, username: null };
    }
  });

  // WebVNC Device deletion
  document.getElementById('confirmDeleteWebVNCDeviceBtn').addEventListener('click', async () => {
    if (!currentDeleteDevice.instance || !currentDeleteDevice.deviceName) return;

    const confirmBtn = document.getElementById('confirmDeleteWebVNCDeviceBtn');
    const originalText = confirmBtn.innerHTML;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Removing...';

    try {
      await removeWebVNCDevice(currentDeleteDevice.instance, currentDeleteDevice.deviceName);
      deleteWebVNCDeviceModal.hide();
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
      currentDeleteDevice = { instance: null, deviceName: null };
    }
  });

  // WebVNC Instance deletion
  document.getElementById('confirmDeleteWebVNCBtn').addEventListener('click', async () => {
    if (!currentDeleteWebVNCInstance) return;

    const confirmBtn = document.getElementById('confirmDeleteWebVNCBtn');
    const originalText = confirmBtn.innerHTML;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';

    try {
      await deleteWebVNC(currentDeleteWebVNCInstance);
      deleteWebVNCModal.hide();
      webvncModal.hide();
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
      currentDeleteWebVNCInstance = null;
    }
  });
}
