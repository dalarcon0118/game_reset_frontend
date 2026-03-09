import { logger } from '../../utils/logger';
import { navigationRef } from '../../navigation/navigation_service';
const log = logger.withTag('NAV_EFFECT');

// Keep track of current view for logging transitions
let currentView = '';

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

/**
 * Extracts the view name from a pathname
 * e.g., '/lister/dashboard' -> 'DASHBOARD', '/lister/profile' -> 'PROFILE'
 */
function extractViewName(pathname: string): string {
  if (!pathname) return 'UNKNOWN';

  // Remove leading slash and get the last segment
  const segments = pathname.replace(/^\//, '').split('/');
  const lastSegment = segments[segments.length - 1] || segments[segments.length - 2] || 'ROOT';

  // Convert to uppercase for consistency
  return lastSegment.toUpperCase();
}

/**
 * Logs a view transition separator
 */
function logViewTransition(newView: string) {
  if (newView !== currentView) {
    const separator = '\n' + '='.repeat(40);
    const viewLog = `${separator}\n 🔄 VIEW: ${newView}\n${separator}`;

    log.info(viewLog);
    currentView = newView;
  }
}

export async function handleNavigation(
  payload: NavigationPayload,
  dispatch: (cmd: any) => void,
  router: any
) {
  const { params, method } = payload;
  const targetPath = payload.pathname || payload.path;

  const now = Date.now();
  if (!navigationRef.isReady()) {
    log.warn('Navigation skipped - navigator not ready', { path: targetPath });
    return;
  }
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

  // Log view transition BEFORE updating state
  const newView = extractViewName(targetPath);
  logViewTransition(newView);

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