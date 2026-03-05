import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { logger } from '@/shared/utils/logger';

/**
 * Hook que loguea automáticamente los cambios de navegación de expo-router.
 * Esto captura tanto navegaciones vía TEA (Cmd.navigate) como navegaciones directas (router.push).
 * 
 * Uso: Agregar este hook en el _layout.tsx principal:
 *   useNavigationLogger();
 */
const log = logger.withTag('NAV_EFFECT');

let currentView = '';

function extractViewName(pathname: string): string {
    if (!pathname) return 'UNKNOWN';
    const segments = pathname.replace(/^\//, '').split('/');
    const lastSegment = segments[segments.length - 1] || segments[segments.length - 2] || 'ROOT';
    return lastSegment.toUpperCase();
}

export function useNavigationLogger() {
    const pathname = usePathname();
    const previousPath = useRef(pathname);

    useEffect(() => {
        // Skip initial mount
        if (!previousPath.current) {
            previousPath.current = pathname;
            return;
        }

        // Only log if path actually changed
        if (previousPath.current !== pathname) {
            const newView = extractViewName(pathname);
            const previousView = extractViewName(previousPath.current);

            // Log view transition separator (only if view changed)
            if (newView !== currentView) {
                const separator = '\n' + '='.repeat(40);
                log.info(`${separator}\n 🔄 VIEW: ${newView}\n${separator}`);
                currentView = newView;
            }

            // Log the navigation
            log.info(`Navigated from ${previousPath.current} to ${pathname}`, {
                from: previousView,
                to: newView
            });

            previousPath.current = pathname;
        }
    }, [pathname]);
}
