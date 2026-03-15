// WebView Management Functions
function showCreateWebViewModal(instanceName) {
  currentCreateWebviewInstance = instanceName;
  document.getElementById('createWebviewInstanceName').textContent = instanceName;

  // Reset form
  document.getElementById('createWebviewForm').reset();
  document.getElementById('webviewLoginUsersContainer').innerHTML = '';
  document.getElementById('webviewConfigPreview').style.display = 'none';
  webviewWireguardConfig = '';

  createWebviewModal.show();
}

async function showWebViewModal(instanceName) {
  currentWebviewInstance = instanceName;
  document.getElementById('webviewInstanceName').textContent = instanceName;

  webviewModal.show();

  // Use data from instances instead of making separate API call
  const instance = instances[instanceName];
  if (instance && instance.webView) {
    renderWebViewContent(instance.webView);
  } else {
    document.getElementById('webviewContent').innerHTML = '<div class="alert alert-danger">WebView not configured for this instance</div>';
  }
}

function renderWebViewContent(webviewData) {
  const contentDiv = document.getElementById('webviewContent');
  const isOnline = webviewData.status === 'online';

  let html = `
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h6>WebView Status</h6>
                <span class="badge bg-${isOnline ? 'success' : 'warning'}">
                    <i class="fas fa-${isOnline ? 'check-circle' : 'pause-circle'} me-1"></i>
                    ${isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
            ${
              isOnline
                ? `
                <div class="mt-2">
                    <a href="https://${webviewData.subdomain}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt me-1"></i>Open WebView
                    </a>
                </div>
            `
                : ''
            }
        </div>

        <div class="mb-3">
            <h6>Instance Controls</h6>
            <div class="btn-group" role="group">
                <button class="btn btn-sm ${isOnline ? 'btn-warning' : 'btn-success'}" onclick="${isOnline ? 'stopWebView' : 'startWebView'}('${currentWebviewInstance}')">
                    <i class="fas fa-${isOnline ? 'stop' : 'play'} me-1"></i>${isOnline ? 'Stop' : 'Start'}
                </button>
                <button class="btn btn-sm btn-info" onclick="restartWebView('${currentWebviewInstance}')" ${!isOnline ? 'disabled' : ''}>
                    <i class="fas fa-redo me-1"></i>Restart
                </button>
                <button class="btn btn-sm btn-secondary" onclick="recreateWebView('${currentWebviewInstance}')">
                    <i class="fas fa-gears me-1"></i>Recreate
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteWebView('${currentWebviewInstance}')">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        </div>

        <div class="mb-3">
            <h6>Login Users (${webviewData.loginUsers ? webviewData.loginUsers.length : 0})</h6>
            <div class="mb-2">
    `;

  if (webviewData.loginUsers && webviewData.loginUsers.length > 0) {
    webviewData.loginUsers.forEach((user) => {
      html += `
                <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-1">
                    <span>
                      <i class="fas fa-user me-2"></i>${user.username} 
                      <small class="text-muted ms-1">(${user.role || 'user'})</small>
                    </span>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmRemoveWebViewUser('${currentWebviewInstance}', '${user.username}')">
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
            <button class="btn btn-sm btn-outline-primary" onclick="showAddWebViewUserForm()">
                <i class="fas fa-plus me-1"></i>Add User
            </button>
        </div>

        <div id="addWebViewUserForm" style="display: none;" class="mb-3">
            <h6>Add Login User</h6>
            <div class="row g-2">
                <div class="col-4">
                    <input type="text" class="form-control" id="newWebViewUsername" placeholder="Username">
                </div>
                <div class="col-4">
                    <input type="password" class="form-control" id="newWebViewPassword" placeholder="Password">
                </div>
                <div class="col-4">
                    <select class="form-select" id="newWebViewRole">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="col-12 mt-2">
                    <button class="btn btn-sm btn-primary me-2" onclick="addWebViewUser()">
                        <i class="fas fa-plus me-1"></i>Add
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="hideAddWebViewUserForm()">Cancel</button>
                </div>
            </div>
        </div>
    `;

  contentDiv.innerHTML = html;
}

async function createWebView() {
  if (!webviewWireguardConfig) {
    showToast('Please upload a WireGuard configuration file', 'error');
    return;
  }

  // Collect login users
  const loginUsers = [];
  const userContainers = document.querySelectorAll('#webviewLoginUsersContainer > div');
  userContainers.forEach((container) => {
    const username = container.querySelector('[data-field="username"]')?.value;
    const password = container.querySelector('[data-field="password"]')?.value;
    const role = container.querySelector('[data-field="role"]')?.value;
    if (username && password) {
      loginUsers.push({ username, password, role });
    }
  });

  const confirmBtn = document.getElementById('confirmCreateWebviewBtn');
  const originalText = confirmBtn.innerHTML;

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';

  try {
    const response = await fetch(API_ENDPOINTS.webview.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: currentCreateWebviewInstance,
        wireguardConfig: webviewWireguardConfig,
        loginUsers,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`WebView instance created successfully!`, 'success');
      createWebviewModal.hide();
      await loadInstances();
    } else {
      throw new Error(result.error || 'Creation failed');
    }
  } catch (error) {
    showToast(`Failed to create WebView: ${error.message}`, 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalText;
  }
}

// WebView Control Functions
async function startWebView(name) {
  await webviewAction('start', name);
}

async function stopWebView(name) {
  await webviewAction('stop', name);
}

async function restartWebView(name) {
  await webviewAction('restart', name);
}

async function recreateWebView(name) {
  await webviewAction('recreate', name);
}

async function deleteWebView(name) {
  try {
    const response = await fetch(API_ENDPOINTS.webview.delete, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('WebView instance deleted successfully!', 'success');
      await loadInstances();
    } else {
      throw new Error(result.error || 'Failed to delete WebView');
    }
  } catch (error) {
    console.error('Error deleting WebView:', error);
    showToast(`Failed to delete WebView: ${error.message}`, 'error');
  }
}

async function webviewAction(action, name) {
  try {
    const response = await fetch(API_ENDPOINTS.webview[action], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`WebView ${action}ed successfully!`, 'success');
      if (currentWebviewInstance === name) {
        await loadInstances();
        showWebViewModal(name);
      }
    } else {
      throw new Error(result.error || `${action} failed`);
    }
  } catch (error) {
    showToast(`Failed to ${action} WebView: ${error.message}`, 'error');
  }
}

// WebView User Management
function showAddWebViewUserForm() {
  document.getElementById('addWebViewUserForm').style.display = 'block';
}

function hideAddWebViewUserForm() {
  document.getElementById('addWebViewUserForm').style.display = 'none';
  document.getElementById('newWebViewUsername').value = '';
  document.getElementById('newWebViewPassword').value = '';
  document.getElementById('newWebViewRole').value = 'user';
}

async function addWebViewUser() {
  const username = document.getElementById('newWebViewUsername')?.value;
  const password = document.getElementById('newWebViewPassword')?.value;
  const role = document.getElementById('newWebViewRole')?.value || 'user';

  if (!username || !password) {
    showToast('Username and password are required', 'error');
    return;
  }

  try {
    const response = await fetch(API_ENDPOINTS.webview.users.add, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: currentWebviewInstance,
        username: username,
        password: password,
        role: role,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('User added successfully!', 'success');
      hideAddWebViewUserForm();
      await loadInstances();
      showWebViewModal(currentWebviewInstance);
    } else {
      throw new Error(result.error || 'Failed to add user');
    }
  } catch (error) {
    showToast(`Failed to add user: ${error.message}`, 'error');
  }
}

async function removeWebViewUser(instanceName, username) {
  try {
    const response = await fetch(API_ENDPOINTS.webview.users.remove, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: instanceName,
        username: username,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast('User removed successfully!', 'success');
      await loadInstances();
      showWebViewModal(instanceName);
    } else {
      throw new Error(result.error || 'Failed to remove user');
    }
  } catch (error) {
    showToast(`Failed to remove user: ${error.message}`, 'error');
  }
}

// Confirmation functions
function confirmRemoveWebViewUser(instanceName, username) {
  currentDeleteWebViewUser = { instance: instanceName, username: username };
  document.getElementById('deleteWebViewUserName').textContent = username;
  document.getElementById('deleteWebViewUserInstance').textContent = instanceName;
  deleteWebViewUserModal.show();
}

function confirmDeleteWebView(instanceName) {
  currentDeleteWebViewInstance = instanceName;
  document.getElementById('deleteWebViewInstanceName').textContent = instanceName;
  deleteWebViewModal.show();
}

// File upload functions
function setupWebViewFileUpload() {
  const uploadArea = document.getElementById('webviewConfigUploadArea');
  const fileInput = document.getElementById('webviewConfigFileInput');

  if (!uploadArea || !fileInput) return;

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
      handleWebViewFileUpload(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleWebViewFileUpload(e.target.files[0]);
    }
  });
}

function handleWebViewFileUpload(file) {
  if (!file.name.endsWith('.conf')) {
    showToast('Please select a valid .conf file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    webviewWireguardConfig = e.target.result;
    document.getElementById('webviewConfigContent').textContent = webviewWireguardConfig;
    document.getElementById('webviewConfigPreview').style.display = 'block';
  };
  reader.onerror = () => {
    showToast('Error reading file', 'error');
  };
  reader.readAsText(file);
}

function addWebViewLoginUserField() {
  const container = document.getElementById('webviewLoginUsersContainer');
  const index = container.children.length;

  const html = `
        <div class="row g-2 mb-2" id="webviewUser-${index}">
            <div class="col-4">
                <input type="text" class="form-control" data-field="username" placeholder="Username" required>
            </div>
            <div class="col-4">
                <input type="password" class="form-control" data-field="password" placeholder="Password" required>
            </div>
            <div class="col-3">
                <select class="form-control" data-field="role">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="col-1">
                <button class="btn btn-outline-danger w-100" type="button" onclick="removeWebViewLoginUserField(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

  container.insertAdjacentHTML('beforeend', html);
}

function removeWebViewLoginUserField(index) {
  const element = document.getElementById(`webviewUser-${index}`);
  if (element) {
    element.remove();
  }
}

function setupWebViewDeleteConfirmations() {
  const deleteWebViewUserConfirmBtn = document.getElementById('confirmDeleteWebViewUserBtn');
  if (deleteWebViewUserConfirmBtn) {
    deleteWebViewUserConfirmBtn.addEventListener('click', async () => {
      if (!currentDeleteWebViewUser.instance || !currentDeleteWebViewUser.username) return;

      const originalText = deleteWebViewUserConfirmBtn.innerHTML;
      deleteWebViewUserConfirmBtn.disabled = true;
      deleteWebViewUserConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Removing...';

      try {
        await removeWebViewUser(currentDeleteWebViewUser.instance, currentDeleteWebViewUser.username);
        deleteWebViewUserModal.hide();
      } finally {
        deleteWebViewUserConfirmBtn.disabled = false;
        deleteWebViewUserConfirmBtn.innerHTML = originalText;
        currentDeleteWebViewUser = { instance: null, username: null };
      }
    });
  }

  const deleteWebViewConfirmBtn = document.getElementById('confirmDeleteWebViewBtn');
  if (deleteWebViewConfirmBtn) {
    deleteWebViewConfirmBtn.addEventListener('click', async () => {
      if (!currentDeleteWebViewInstance) return;

      const originalText = deleteWebViewConfirmBtn.innerHTML;
      deleteWebViewConfirmBtn.disabled = true;
      deleteWebViewConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';

      try {
        await deleteWebView(currentDeleteWebViewInstance);
        deleteWebViewModal.hide();
        webviewModal.hide();
      } finally {
        deleteWebViewConfirmBtn.disabled = false;
        deleteWebViewConfirmBtn.innerHTML = originalText;
        currentDeleteWebViewInstance = null;
      }
    });
  }
}
