// Instance Management Functions
async function loadInstances() {
  if (!authToken) return;

  try {
    const response = await fetch(API_ENDPOINTS.wireguard.instances, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      instances = await response.json();
      renderInstances();
    } else if (response.status === 401 || response.status === 403) {
      logout();
    } else {
      throw new Error('Failed to load instances');
    }
  } catch (error) {
    console.error('Error loading instances:', error);
    showToast('Failed to load instances', 'error');
    renderInstances();
  }
}

function renderInstances() {
  const container = document.getElementById('instancesContainer');
  const instanceNames = Object.keys(instances);

  if (instanceNames.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No instances found</h5>
                <p class="text-muted">Create your first WireGuard instance using the form above</p>
            </div>
        `;
    return;
  }

  let tableHtml = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr>
                        <th><i class="fas fa-tag me-1"></i>Name</th>
                        <th><i class="fas fa-network-wired me-1"></i>IPv4 Address</th>
                        <th><i class="fas fa-signal me-1"></i>Status</th>
                        <th><i class="fas fa-desktop me-1"></i>WebVNC</th>
                        <th><i class="fas fa-plug me-1"></i>VPN Port</th>
                        <th><i class="fas fa-link me-1"></i>Admin</th>
                        <th><i class="fas fa-cogs me-1"></i>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

  instanceNames.forEach((name) => {
    const instance = instances[name];
    const isOnline = instance.status === 'online';
    const statusClass = isOnline ? 'status-online' : 'status-offline';
    const statusColor = isOnline ? 'success' : 'danger';
    const statusIcon = isOnline ? 'check-circle' : 'times-circle';
    const statusText = isOnline ? 'Online' : 'Offline';

    // Use remoteVNC data from instances response
    let webvncColumn = '';

    if (instance.remoteVNC) {
      const vncOnline = instance.remoteVNC.status === 'online';
      const vncStatusColor = vncOnline ? 'success' : 'danger';
      const vncStatusIcon = vncOnline ? 'check-circle' : 'times-circle';
      const vncStatusText = vncOnline ? 'Online' : 'Offline';
      const vncStatusClass = vncOnline ? 'status-online' : 'status-offline';

      webvncColumn = `
                <div class="d-flex flex-column align-items-center gap-1">
                    <span class="badge bg-${vncStatusColor} webvnc-badge ${vncStatusClass}">
                        <i class="fas fa-${vncStatusIcon} me-1"></i>${vncStatusText}
                    </span>
                    <button class="btn btn-xs btn-outline-primary" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;" onclick="showWebVNCModal('${name}')">
                        <i class="fas fa-cog me-1"></i>Manage
                    </button>
                </div>
            `;
    } else {
      webvncColumn = `
                <button class="btn btn-sm btn-outline-success" onclick="showCreateWebVNCModal('${name}')">
                    <i class="fas fa-plus me-1"></i>Add WebVNC
                </button>
            `;
    }

    tableHtml += `
            <tr>
                <td class="fw-bold">${name}</td>
                <td><code>${instance.ipv4}</code></td>
                <td>
                    <span class="badge bg-${statusColor} ${statusClass}">
                        <i class="fas fa-${statusIcon} me-1"></i>${statusText}
                    </span>
                </td>
                <td>${webvncColumn}</td>
                <td><code>${instance.udpPort}/udp</code></td>
                <td>
                    <a href="https://${instance.subdomain}" target="_blank" class="btn btn-sm ${isOnline ? 'btn-primary' : 'btn-outline-primary'}" ${!isOnline ? 'style="pointer-events: none;"' : ''}>
                        <i class="fas fa-external-link-alt me-1"></i>Open
                    </a>
                </td>
                <td>
                    <div class="action-buttons">
                        ${
                          !isOnline
                            ? `
                            <button class="btn btn-sm btn-success" onclick="startInstance('${name}')">
                                <i class="fas fa-play me-1"></i>Start
                            </button>
                        `
                            : `
                            <button class="btn btn-sm btn-warning" onclick="stopInstance('${name}')">
                                <i class="fas fa-stop me-1"></i>Stop
                            </button>
                        `
                        }
                        <button class="btn btn-sm ${isOnline ? 'btn-info' : 'btn-outline-info'}" onclick="restartInstance('${name}')" ${!isOnline ? 'disabled' : ''}>
                            <i class="fas fa-redo me-1"></i>Restart
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('${name}')">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });

  tableHtml += `
                </tbody>
            </table>
        </div>
    `;

  container.innerHTML = tableHtml;
}

async function createInstance(requestData) {
  if (!dockerConnected) {
    showToast('Cannot create instance: Docker is not connected', 'error');
    return;
  }

  const submitBtn = document.querySelector('#createForm button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';

  try {
    const response = await fetch(API_ENDPOINTS.wireguard.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`Instance "${requestData.name}" created successfully!`, 'success');
      await loadInstances();
      document.getElementById('createForm').reset();
      document.getElementById('namePreview').textContent = 'wg-easy-[sanitized-name]';
    } else {
      throw new Error(result.error || 'Creation failed');
    }
  } catch (error) {
    console.error('Error creating instance:', error);
    showToast(`Failed to create instance: ${error.message}`, 'error');
    await loadInstances();
  } finally {
    submitBtn.disabled = !dockerConnected;
    submitBtn.innerHTML = originalText;
  }
}

async function containerAction(action, name) {
  const submitBtn = event.target;
  const originalText = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${action.charAt(0).toUpperCase() + action.slice(1)}ing...`;

  try {
    const response = await fetch(API_ENDPOINTS.wireguard[action], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const result = await response.json();

    if (response.ok) {
      showToast(`Instance "${name}" ${action}ed successfully!`, 'success');
      await loadInstances();
    } else {
      throw new Error(result.error || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`);
    }
  } catch (error) {
    console.error(`Error ${action}ing instance:`, error);
    showToast(`Failed to ${action} instance: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function startInstance(name) {
  await containerAction('start', name);
}

async function stopInstance(name) {
  await containerAction('stop', name);
}

async function restartInstance(name) {
  await containerAction('restart', name);
}

function confirmDelete(name) {
  currentDeleteInstance = name;
  document.getElementById('deleteInstanceName').textContent = name;
  deleteModal.show();
}

function setupInstanceDeletion() {
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!currentDeleteInstance) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';

    try {
      const response = await fetch(API_ENDPOINTS.wireguard.delete, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: currentDeleteInstance }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(`Instance "${currentDeleteInstance}" deleted successfully!`, 'success');
        await loadInstances();
        deleteModal.hide();
      } else {
        throw new Error(result.error || 'Deletion failed');
      }
    } catch (error) {
      console.error('Error deleting instance:', error);
      showToast(`Failed to delete instance: ${error.message}`, 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
      currentDeleteInstance = null;
    }
  });
}

function sanitizeServiceName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}
