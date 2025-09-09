// Theme Management
function getStoredTheme() {
    return localStorage.getItem('theme') || 'light';
}

function setStoredTheme(theme) {
    localStorage.setItem('theme', theme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    updateThemeToggleIcon(theme);
    updateLoginThemeToggleIcon(theme);
}

function updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.title = 'Switch to light theme';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.title = 'Switch to dark theme';
        }
    }
}

function updateLoginThemeToggleIcon(theme) {
    const loginThemeToggle = document.getElementById('loginThemeToggle');
    if (loginThemeToggle) {
        if (theme === 'dark') {
            loginThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            loginThemeToggle.title = 'Switch to light theme';
        } else {
            loginThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            loginThemeToggle.title = 'Switch to dark theme';
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setStoredTheme(newTheme);
}