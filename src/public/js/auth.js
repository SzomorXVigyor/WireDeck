// Authentication Functions
function checkAuth() {
    if (!authToken) {
        showLogin();
        return false;
    }

    fetch(API_ENDPOINTS.wireguard.instances, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then(response => {
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            authToken = null;
            showLogin();
        } else {
            showMainApp();
        }
    }).catch(() => {
        showLogin();
    });

    return true;
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    updateLoginThemeToggleIcon(document.documentElement.getAttribute('data-bs-theme'));
}

function showMainApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    if (currentUser) {
        document.getElementById('currentUsername').textContent = currentUser;
    }
    initializeApp();
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showLogin();
}

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Logging in...';

        try {
            const response = await fetch(API_ENDPOINTS.auth.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                authToken = result.token;
                currentUser = result.username;
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('currentUser', currentUser);
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                showMainApp();
            } else {
                showLoginAlert(result.error || 'Login failed', 'danger');
            }
        } catch (error) {
            showLoginAlert('Network error. Please try again.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});

function showLoginAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('loginAlert');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    alertContainer.style.display = 'block';
    setTimeout(() => {
        alertContainer.style.display = 'none';
    }, 5000);
}

// Password change functionality
function showChangePasswordModal() {
    changePasswordModal.show();
}

function showPasswordChangeAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('passwordChangeAlert');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    alertContainer.style.display = 'block';
    setTimeout(() => {
        alertContainer.style.display = 'none';
    }, 5000);
}

function setupPasswordChange() {
    document.getElementById('confirmPasswordChangeBtn').addEventListener('click', async () => {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showPasswordChangeAlert('All fields are required', 'danger');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showPasswordChangeAlert('New passwords do not match', 'danger');
            return;
        }

        if (newPassword.length < 6) {
            showPasswordChangeAlert('New password must be at least 6 characters long', 'danger');
            return;
        }

        const confirmBtn = document.getElementById('confirmPasswordChangeBtn');
        const originalText = confirmBtn.innerHTML;

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Changing...';

        try {
            const response = await fetch(API_ENDPOINTS.auth.changePassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();

            if (response.ok) {
                showPasswordChangeAlert(result.message, 'success');
                document.getElementById('changePasswordForm').reset();
                setTimeout(() => {
                    changePasswordModal.hide();
                }, 2000);
            } else {
                showPasswordChangeAlert(result.error || 'Password change failed', 'danger');
            }
        } catch (error) {
            showPasswordChangeAlert('Network error. Please try again.', 'danger');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalText;
        }
    });
}