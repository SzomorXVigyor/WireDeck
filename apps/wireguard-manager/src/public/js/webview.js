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
    document.getElementById('webviewContent').innerHTML = '<p class="text-muted">No WebView instance configured</p>';
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
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <div>
                    <strong>${user.username}</strong>
                    <span class="badge bg-${user.role === 'admin' ? 'danger' : 'info'}">${user.role}</span>
                </div>
                <button class="btn btn-sm btn-danger" onclick="confirmRemoveWebViewUser('${currentWebviewInstance}', '${user.username}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
  } else {
    html += '<p class="text-muted small">No users configured</p>';
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
                <div class="col-6">
                    <input type="text" class="form-control" id="newWebViewUsername" placeholder="Username">
                </div>
                <div class="col-6">
                    <input type="password" class="form-control" id="newWebViewPassword" placeholder="Password">
                </div>
                <div class="col-12">
                    <select class="form-control" id="newWebViewRole">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="col-12">
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
  const name = currentCreateWebviewInstance;

  if (!webviewWireguardConfig) {
    showToast('Please provide Wireguard configuration', 'error');
    return;
  }

  // Collect login users
  const loginUsers = [];
  const usernameInputs = document.querySelectorAll('.webview-username-input');
  const passwordInputs = document.querySelectorAll('.webview-password-input');
  const roleInputs = document.querySelectorAll('.webview-role-input');

  for (let i = 0; i < usernameInputs.length; i++) {
    const username = usernameInputs[i].value.trim();
    const password = passwordInputs[i].value.trim();
    const role = roleInputs[i].value;

    if (username && password) {
      loginUsers.push({ username, password, role });
    }
  }

  if (loginUsers.length === 0) {
    showToast('Please add at least one user', 'error');
    return;
  }

  try {
    const response = await fetch(API_ENDPOINTS.webview.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: name,
        wireguardConfig: webviewWireguardConfig,
        loginUsers: loginUsers,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      showToast(`Failed to create WebView: ${error.error || error.message}`, 'error');
      return;
    }

    const result = await response.json();
    showToast('WebView instance created successfully', 'success');
    createWebviewModal.hide();
    await loadInstances();
  } catch (error) {
    showToast(`Error creating WebView: ${error.message}`, 'error');
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
  await webviewAction('delete', name);
}

async function webviewAction(action, name) {
  try {
    const endpoint = API_ENDPOINTS.webview[action];
    if (!endpoint) {
      showToast('Unknown action', 'error');
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name: name }),
    });

    if (!response.ok) {
      const error = await response.json();
      showToast(`Failed to ${action} WebView: ${error.error || error.message}`, 'error');
      return;
    }

    showToast(`WebView ${action} completed successfully`, 'success');
    await loadInstances();
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
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
  const username = document.getElementById('newWebViewUsername').value.trim();
  const password = document.getElementById('newWebViewPassword').value.trim();
  const role = document.getElementById('newWebViewRole').value;

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

    if (!response.ok) {
      const error = await response.json();
      showToast(`Failed to add user: ${error.error || error.message}`, 'error');
      return;
    }

    showToast('User added successfully', 'success');
    hideAddWebViewUserForm();
    await loadInstances();
    const instance = instances[currentWebviewInstance];
    if (instance && instance.webView) {
      renderWebViewContent(instance.webView);
    }
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
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

    if (!response.ok) {
      const error = await response.json();
      showToast(`Failed to remove user: ${error.error || error.message}`, 'error');
      return;
    }

    showToast('User removed successfully', 'success');
    await loadInstances();
    const instance = instances[currentWebviewInstance];
    if (instance && instance.webView) {
      renderWebViewContent(instance.webView);
    }
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

// Confirmation functions
function confirmRemoveWebViewUser(instanceName, username) {
  currentDeleteWebViewUser = { instance: instanceName, username: username };
  document.getElementById('deleteWebViewUserName').textContent = username;
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
    document.getElementById('webviewConfigPreview').textContent = webviewWireguardConfig;
    document.getElementById('webviewConfigPreview').style.display = 'block';
    showToast('Configuration file loaded successfully', 'success');
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
            <div class="col-6">
                <input type="text" class="form-control webview-username-input" placeholder="Username">
            </div>
            <div class="col-4">
                <input type="password" class="form-control webview-password-input" placeholder="Password">
            </div>
            <div class="col-1">
                <select class="form-control webview-role-input">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="col-1">
                <button class="btn btn-sm btn-danger" type="button" onclick="removeWebViewLoginUserField(${index})">
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
      deleteWebViewUserModal.hide();
      await removeWebViewUser(currentDeleteWebViewUser.instance, currentDeleteWebViewUser.username);
    });
  }

  const deleteWebViewConfirmBtn = document.getElementById('confirmDeleteWebViewBtn');
  if (deleteWebViewConfirmBtn) {
    deleteWebViewConfirmBtn.addEventListener('click', async () => {
      deleteWebViewModal.hide();
      await deleteWebView(currentDeleteWebViewInstance);
    });
  }
}
