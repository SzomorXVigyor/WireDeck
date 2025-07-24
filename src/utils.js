function sanitizeServiceName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");
  }
  
  async function checkContainerStatus(docker, containerName) {
    try {
      const containers = await docker.listContainers({ all: true });
      const container = containers.find(c => 
        c.Names.some(name => name === `/${containerName}`)
      );
      
      return container ? container.State === 'running' : false;
    } catch (error) {
      console.error(`Error checking container status: ${error.message}`);
      return false;
    }
  }
  
  async function removeContainer(docker, containerName) {
    try {
      const container = docker.getContainer(containerName);
      await container.stop();
      await container.remove();
      console.log(`🗑️ Container removed: ${containerName}`);
    } catch (error) {
      console.error(`❌ Error removing container: ${error.message}`);
    }
  }
  
  module.exports = {
    sanitizeServiceName,
    checkContainerStatus,
    removeContainer
  };