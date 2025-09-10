// Docker Status Functions
async function checkDockerStatus() {
    try {
        const response = await fetch(API_ENDPOINTS.docker.status, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const status = await response.json();

        const dockerStatus = document.getElementById('dockerStatus');
        const dockerAlert = document.getElementById('dockerAlert');
        const createBtn = document.getElementById('createBtn');

        if (status.connected) {
            dockerConnected = true;
            dockerStatus.className = 'docker-status connected';
            dockerStatus.innerHTML = '<i class="fas fa-check me-1"></i>Docker Connected';
            dockerStatus.title = `Docker ${status.version} on ${status.os}`;
            dockerAlert.style.display = 'none';
            createBtn.disabled = false;
        } else {
            dockerConnected = false;
            dockerStatus.className = 'docker-status disconnected';
            dockerStatus.innerHTML = '<i class="fas fa-times me-1"></i>Docker Disconnected';
            dockerStatus.title = status.error;
            dockerAlert.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>Docker Connection Failed</h6>
                    <p class="mb-2">Cannot connect to Docker daemon:</p>
                    <ul class="mb-2">
                        <li>Ensure Docker socket is mounted: <code>/var/run/docker.sock</code></li>
                        <li>Verify container has Docker socket access</li>
                        <li>Check if Docker daemon is running on host</li>
                    </ul>
                    <small class="text-muted">Error: ${status.error}</small>
                </div>
            `;
            dockerAlert.style.display = 'block';
            createBtn.disabled = true;
        }
    } catch (error) {
        dockerConnected = false;
        const dockerStatus = document.getElementById('dockerStatus');
        dockerStatus.className = 'docker-status disconnected';
        dockerStatus.innerHTML = '<i class="fas fa-times me-1"></i>Connection Error';
        dockerStatus.title = error.message;
        document.getElementById('createBtn').disabled = true;
    }
}