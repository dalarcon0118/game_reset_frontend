/**
 * App Update Feature - Store + Hook
 *
 * Estado reactivo y hook de integracion para
 * la deteccion y UI de actualizaciones.
 */
import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { logger } from '@/shared/utils/logger';
import { getAppVersion } from '@/shared/utils/app_version';
import type { GitHubRelease, AppUpdateInfo, UpdateCheckStatus } from './types';

const log = logger.withTag('APP_UPDATE');

/* ─── GitHub Config ─────────────────────────────────── */

const GITHUB_OWNER = 'dalarcon0118';
const GITHUB_REPO = 'game_reset_frontend';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

let cachedRelease: GitHubRelease | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;
const SKIPPED_VERSION_KEY = 'app_update_skipped_version';

/* ─── Version Utils ─────────────────────────────────── */

export function compareVersions(a: string, b: string): number {
  const normalize = (v: string) =>
    v
      .replace(/^v/, '')
      .split('.')
      .map(Number);
  const partsA = normalize(a);
  const partsB = normalize(b);
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

export function getCurrentVersion(): string {
  try {
    return getAppVersion();
  } catch (e) {
    log.warn('Could not read app version', e);
    return '0.0.1';
  }
}

/* ─── GitHub API ────────────────────────────────────── */

export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  const now = Date.now();
  if (cachedRelease && now - cacheTimestamp < CACHE_TTL_MS) {
    log.debug('Using cached GitHub release');
    return cachedRelease;
  }
  try {
    log.debug('Fetching latest release from GitHub API...');
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      log.warn('GitHub API returned non-OK status', { status: response.status });
      return cachedRelease;
    }
    const releases: GitHubRelease[] = await response.json();
    const latestRelease = releases.find((r) => !r.draft) || null;
    if (latestRelease) {
      cachedRelease = latestRelease;
      cacheTimestamp = now;
      log.info('Latest release found', {
        tag: latestRelease.tag_name,
        prerelease: latestRelease.prerelease,
        assets: latestRelease.assets.length,
      });
    }
    return latestRelease;
  } catch (error) {
    log.warn('Failed to fetch GitHub releases', error);
    return cachedRelease;
  }
}

function findApkAsset(release: GitHubRelease): string | null {
  const apkAsset = release.assets.find(
    (a) =>
      a.name.endsWith('.apk') &&
      a.content_type === 'application/vnd.android.package-archive',
  );
  if (apkAsset) return apkAsset.browser_download_url;
  const anyApk = release.assets.find((a) => a.name.endsWith('.apk'));
  if (anyApk) return anyApk.browser_download_url;
  return release.html_url;
}

export async function checkForUpdate(): Promise<AppUpdateInfo | null> {
  try {
    const currentVersion = getCurrentVersion();
    const release = await fetchLatestRelease();
    if (!release) {
      log.info('No GitHub release found');
      return null;
    }
    const latestVersion = release.tag_name.replace(/^v/, '');

    if (release.tag_name === 'latest') {
      const apkAsset = release.assets.find((a) => a.name.endsWith('.apk'));
      if (apkAsset) {
        const versionMatch = apkAsset.name.match(
          new RegExp('(\\d+\\.\\d+\\.\\d+(?:\\.\\d+)?)'),
        );
        if (versionMatch) {
          const assetVersion = versionMatch[1];
          log.debug('Extracted version from asset name', { assetVersion });
          if (compareVersions(assetVersion, currentVersion) > 0) {
            return {
              currentVersion,
              latestVersion: assetVersion,
              downloadUrl: apkAsset.browser_download_url,
              releaseNotes: release.body || 'Nueva version disponible',
              releaseUrl: release.html_url,
              publishedAt: release.published_at,
              isPrerelease: release.prerelease,
            };
          }
        }
      }
      log.info('Tag is "latest" but could not determine version from assets');
      return null;
    }

    if (compareVersions(latestVersion, currentVersion) > 0) {
      const downloadUrl = findApkAsset(release) || release.html_url;
      log.info('Update available!', { current: currentVersion, latest: latestVersion });
      return {
        currentVersion,
        latestVersion,
        downloadUrl,
        releaseNotes: release.body || 'Nueva version disponible',
        releaseUrl: release.html_url,
        publishedAt: release.published_at,
        isPrerelease: release.prerelease,
      };
    }

    log.info('App is up to date', { current: currentVersion, latest: latestVersion });
    return null;
  } catch (error) {
    log.error('Error checking for update', error);
    return null;
  }
}

/* ─── Zustand Store ─────────────────────────────────── */

interface AppUpdateState {
  status: UpdateCheckStatus;
  updateInfo: AppUpdateInfo | null;
  currentVersion: string;
  lastCheckedAt: string | null;
}

interface AppUpdateActions {
  check: () => Promise<void>;
  download: () => Promise<void>;
  dismiss: () => void;
  reset: () => void;
}

export const useAppUpdateStore = create<AppUpdateState & AppUpdateActions>((set, get) => ({
  status: 'idle' as UpdateCheckStatus,
  updateInfo: null,
  currentVersion: getCurrentVersion(),
  lastCheckedAt: null,

  check: async () => {
    const { status } = get();
    if (status === 'checking') return;
    set({ status: 'checking' as UpdateCheckStatus });
    try {
      const updateInfo = await checkForUpdate();
      if (updateInfo) {
        const skippedVersion = await AsyncStorage.getItem(SKIPPED_VERSION_KEY);
        if (skippedVersion === updateInfo.latestVersion) {
          log.debug('User previously dismissed this version', { version: skippedVersion });
          set({ status: 'dismissed' as UpdateCheckStatus, lastCheckedAt: new Date().toISOString() });
          return;
        }
        set({
          status: 'available' as UpdateCheckStatus,
          updateInfo,
          lastCheckedAt: new Date().toISOString(),
        });
      } else {
        set({ status: 'not-available' as UpdateCheckStatus, lastCheckedAt: new Date().toISOString() });
      }
    } catch (error) {
      log.error('Update check failed', error);
      set({ status: 'error' as UpdateCheckStatus });
    }
  },

  download: async () => {
    const { updateInfo } = get();
    if (!updateInfo) return;
    try {
      log.info('Opening download URL in browser', { url: updateInfo.downloadUrl });
      const supported = await Linking.canOpenURL(updateInfo.downloadUrl);
      if (supported) {
        await Linking.openURL(updateInfo.downloadUrl);
      } else {
        log.warn('Cannot open download URL directly, opening release page');
        await Linking.openURL(updateInfo.releaseUrl);
      }
    } catch (error) {
      log.error('Failed to open download URL', error);
    }
  },

  dismiss: () => {
    const { updateInfo } = get();
    if (updateInfo) {
      AsyncStorage.setItem(SKIPPED_VERSION_KEY, updateInfo.latestVersion).catch(() => {});
    }
    set({ status: 'dismissed' as UpdateCheckStatus });
  },

  reset: () => {
    set({ status: 'idle' as UpdateCheckStatus, updateInfo: null, lastCheckedAt: null });
  },
}));

/* ─── Hook ──────────────────────────────────────────── */

const INITIAL_CHECK_DELAY_MS = 3000;
const BACKGROUND_CHECK_MIN_INTERVAL_MS = 30 * 60 * 1000;

export function useAppUpdate() {
  const check = useAppUpdateStore((s) => s.check);
  const status = useAppUpdateStore((s) => s.status);
  const appStateRef = useRef(AppState.currentState);
  const lastBackgroundCheckRef = useRef(0);
  const hasCheckedInitially = useRef(false);

  useEffect(() => {
    if (hasCheckedInitially.current) return;
    hasCheckedInitially.current = true;
    const timer = setTimeout(() => {
      log.debug('Running initial update check');
      check();
    }, INITIAL_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [check]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: string) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      const isNowActive = nextAppState === 'active';
      if (wasBackground && isNowActive) {
        const now = Date.now();
        const timeSinceLastCheck = now - lastBackgroundCheckRef.current;
        if (timeSinceLastCheck >= BACKGROUND_CHECK_MIN_INTERVAL_MS) {
          log.debug('App returned from background, checking for updates');
          lastBackgroundCheckRef.current = now;
          check();
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [check]);

  return { status };
}