# Sub-App Release Process

This repository uses GitHub Actions to automatically build and release Docker images for individual sub-apps when specific git tags are pushed.

## How to trigger a release

To trigger a release for a specific sub-app, you need to create and push a git tag following this established naming convention:

```text
releases/<app-name>/<version>
```

### Available Applications and Tag Formats

| Application | Tag Format to Trigger Release | Example Command |
|-------------|-------------------------------|-----------------|
| **Webview** | `releases/webview/*` | `git tag releases/webview/v1.0.0` |
| **WebVNC** | `releases/webvnc/*` | `git tag releases/webvnc/v1.0.0` |
| **Wireguard Manager** | `releases/wireguard-manager/*` | `git tag releases/wireguard-manager/v1.0.0` |
| **Database Migrator** | `releases/database-migrator/*` | `git tag releases/database-migrator/v1.0.0` |

### Step-by-Step Guide

1. Make sure all your changes are committed and pushed to your working branch (ideally main/master).
2. Create a git tag for the target application using the correct prefix. For example, to release version `v1.2.0` of `webview`:
   ```bash
   git tag releases/webview/v1.2.0
   ```
3. Push the tag to the remote repository on GitHub:
   ```bash
   git push origin releases/webview/v1.2.0
   ```
4. Navigate to the **Actions** tab on the GitHub repository page. You will see a new workflow run triggered for the specific sub-app.
5. Once the job succeeds, the new Docker image will be published to the GitHub Container Registry (`ghcr.io`).