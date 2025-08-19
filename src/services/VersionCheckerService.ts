export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion: string;
  downloadUrl?: string;
  changelog?: string;
  releaseDate?: string;
}

const DISMISSED_VERSIONS_KEY = "tagify:dismissedVersions";

export class VersionCheckerService {
  private currentVersion: string;
  private repoOwner: string;
  private repoName: string;

  constructor(currentVersion: string, repoOwner: string, repoName: string) {
    this.currentVersion = currentVersion;
    this.repoOwner = repoOwner;
    this.repoName = repoName;
  }

  async checkForUpdates(): Promise<UpdateInfo> {
    const baseInfo: UpdateInfo = {
      hasUpdate: false,
      currentVersion: this.currentVersion,
    };

    try {
      const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn(`GitHub API responded with status: ${response.status}`);
        return baseInfo;
      }

      const release = await response.json();
      const latestVersion = this.normalizeVersion(release.tag_name);
      const currentVersion = this.normalizeVersion(this.currentVersion);

      const hasUpdate = this.isNewerVersion(latestVersion, currentVersion);

      if (hasUpdate) {
        return {
          hasUpdate: true,
          latestVersion: release.tag_name,
          currentVersion: this.currentVersion,
          downloadUrl: release.html_url,
          changelog: release.body || "No changelog available",
          releaseDate: release.published_at,
        };
      }

      return baseInfo;
    } catch (error) {
      console.error("Failed to check for updates:", error);
      return baseInfo;
    }
  }

  private normalizeVersion(version: string): string {
    // Remove 'v' prefix and any non-numeric characters except dots
    return version.replace(/^v/, "").replace(/[^\d.]/g, "");
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split(".").map((num) => parseInt(num, 10) || 0);
    const currentParts = current.split(".").map((num) => parseInt(num, 10) || 0);

    // Ensure both arrays have the same length (pad with zeros)
    const maxLength = Math.max(latestParts.length, currentParts.length);
    while (latestParts.length < maxLength) latestParts.push(0);
    while (currentParts.length < maxLength) currentParts.push(0);

    for (let i = 0; i < maxLength; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }

    return false;
  }

  // Utility method to check if user dismissed this specific version
  static isDismissed(version: string): boolean {
    const dismissed = localStorage.getItem(DISMISSED_VERSIONS_KEY);
    if (!dismissed) return false;

    try {
      const dismissedVersions = JSON.parse(dismissed);
      return dismissedVersions.includes(version);
    } catch {
      return false;
    }
  }

  // Utility method to dismiss a specific version
  static dismissVersion(version: string): void {
    const dismissed = localStorage.getItem(DISMISSED_VERSIONS_KEY);
    let dismissedVersions: string[] = [];

    if (dismissed) {
      try {
        dismissedVersions = JSON.parse(dismissed);
      } catch {
        dismissedVersions = [];
      }
    }

    if (!dismissedVersions.includes(version)) {
      dismissedVersions.push(version);
      localStorage.setItem(DISMISSED_VERSIONS_KEY, JSON.stringify(dismissedVersions));
    }
  }

  // Clear old dismissed versions (call this periodically to prevent localStorage bloat)
  static clearOldDismissals(): void {
    localStorage.removeItem(DISMISSED_VERSIONS_KEY);
  }
}
