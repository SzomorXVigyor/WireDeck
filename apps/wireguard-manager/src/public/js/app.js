// Main Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Set theme before anything else
  setTheme(getStoredTheme());
  checkAuth();
});

// Initialize app after successful login
function initializeApp() {
  // Initialize modals
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
  webvncModal = new bootstrap.Modal(document.getElementById('webvncModal'));
  createWebvncModal = new bootstrap.Modal(document.getElementById('createWebvncModal'));
  deleteWebVNCUserModal = new bootstrap.Modal(document.getElementById('deleteWebVNCUserModal'));
  deleteWebVNCDeviceModal = new bootstrap.Modal(document.getElementById('deleteWebVNCDeviceModal'));
  deleteWebVNCModal = new bootstrap.Modal(document.getElementById('deleteWebVNCModal'));

  // Check Docker status and load instances
  checkDockerStatus();
  loadInstances();

  // Set up form handlers and event listeners
  setupFormHandlers();
  setupFileUpload();
  setupPasswordChange();
  setupInstanceDeletion();
  setupWebVNCDeleteConfirmations();

  // Auto-refresh every 30 seconds
  setInterval(loadInstances, 30000);
}

function setupFormHandlers() {
  // Create WireGuard form handler
  document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get('name').trim();
    const ipv4Cidr = formData.get('ipv4Cidr').trim();
    const username = formData.get('username').trim();
    const password = formData.get('password').trim();

    if (!name) {
      showToast('Please enter an instance name', 'error');
      return;
    }

    const sanitized = sanitizeServiceName(name);
    if (!sanitized) {
      showToast('Instance name contains only invalid characters', 'error');
      return;
    }

    if (instances[name]) {
      showToast('An instance with this name already exists', 'error');
      return;
    }

    const requestBody = { name };
    if (ipv4Cidr) requestBody.ipv4Cidr = ipv4Cidr;
    if (username) requestBody.username = username;
    if (password) requestBody.password = password;

    await createInstance(requestBody);
  });

  // Name preview
  document.getElementById('instanceName').addEventListener('input', (e) => {
    const sanitized = sanitizeServiceName(e.target.value);
    document.getElementById('namePreview').textContent = sanitized ? `wg-easy-${sanitized}` : 'wg-easy-[sanitized-name]';
  });

  // Create WebVNC form handler
  document.getElementById('confirmCreateWebvncBtn').addEventListener('click', async () => {
    await createWebVNC();
  });
}
