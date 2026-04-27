/**
 * App Update Feature - Types
 *
 * Tipos para la deteccion y notificacion
 * de actualizaciones desde GitHub Releases.
 */

export type UpdateCheckStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'dismissed'
  | 'error';

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  releaseUrl: string;
  publishedAt: string;
  isPrerelease: boolean;
}

export interface GitHubAsset {
  name: string;
  content_type: string;
  size: number;
  browser_download_url: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  html_url: string;
  assets: GitHubAsset[];
}