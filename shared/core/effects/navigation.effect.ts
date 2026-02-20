import { logger } from '../../utils/logger';

const log = logger.withTag('NAV_EFFECT');

export interface NavigationPayload {
  pathname?: string;
  path?: string;
  params?: any;
  method?: string;
}

// Navigation Guard State
let lastNavigation = {
  pathname: '',
  params: JSON.stringify({}),
  timestamp: 0,
};

const NAVIGATION_THRESHOLD_MS = 500;

export async function handleNavigation(
  payload: NavigationPayload,
  dispatch: (cmd: any) => void,
  router: any
) {
  const { params, method } = payload;
  const targetPath = payload.pathname || payload.path;

  const now = Date.now();

  // Handle Back Navigation
  if (method === 'back') {
    log.info('Navigating back');
    try {
      router.back();
    } catch (error) {
      log.error('Navigation back failed', error);
    }
    return;
  }

  if (!targetPath) {
    log.error('Navigation failed - missing path/pathname', payload);
    return;
  }

  // Check for duplicate navigation (debounce)
  const isDuplicate =
    targetPath === lastNavigation.pathname &&
    JSON.stringify(params || {}) === lastNavigation.params &&
    now - lastNavigation.timestamp < NAVIGATION_THRESHOLD_MS;

  if (isDuplicate) {
    log.warn('Duplicate navigation prevented', { path: targetPath, params });
    return;
  }

  // Update last navigation state
  lastNavigation = {
    pathname: targetPath,
    params: JSON.stringify(params || {}),
    timestamp: now,
  };

  log.info(`Navigating to: ${targetPath}`, { method, params });

  try {
    if (method === 'replace') {
      router.replace({ pathname: targetPath, params });
    } else {
      router.push({ pathname: targetPath, params });
    }
  } catch (error) {
    log.error('Navigation failed', error, { path: targetPath, params });
  }
}