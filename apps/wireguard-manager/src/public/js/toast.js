// Toast Functionality
function showToast(message, type = 'success', duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  const toastId = 'toast-' + Date.now();

  const iconMap = {
    success: 'check-circle',
    error: 'exclamation-triangle',
    warning: 'exclamation-triangle',
    info: 'info-circle',
  };

  const bgMap = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info',
  };

  const icon = iconMap[type] || 'info-circle';
  const bgClass = bgMap[type] || 'info';

  const toastHtml = `
        <div class="toast align-items-center text-bg-${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icon} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: duration });

  toast.show();

  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}
