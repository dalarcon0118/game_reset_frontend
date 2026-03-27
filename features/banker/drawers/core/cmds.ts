import { Cmd, RemoteData, RemoteDataHttp } from '@core/tea-utils';
import { routes } from '@/config/routes';
import { structureRepository } from '@/shared/repositories/structure';
import { ListeroDetails } from '@/shared/services/structure';
import { TimePolicy } from '@/shared/repositories/system/time/time.update';
import { TimerRepository } from '@/shared/repositories/system/time';

/**
 * 🛠️ DRAWERS COMMANDS
 * Centraliza todas las intenciones de efectos secundarios de Drawers.
 * Sigue el patrón TEA: Son datos declarativos, no ejecución imperativa.
 */
export const Cmds = {
    // 🌐 HTTP COMMANDS (Self-contained Task)
    fetchListeroDetails: (id: number, date: Date): Cmd => {
        const dateStr = TimePolicy.formatLocalDate(date);
        return RemoteDataHttp.fetch(
            () => structureRepository.getListeroDetails(id, dateStr),
            (webData) => ({ type: 'DETAILS_RECEIVED', webData }),
            'fetchListeroDetails'
        );
    },

    // 📍 NAVIGATION COMMANDS
    navigateBack: (): Cmd =>
        Cmd.navigate({ pathname: '', method: 'back' }),

    navigateToReport: (drawId: number): Cmd =>
        Cmd.navigate({
            pathname: routes.banker.reports_form.screen,
            params: { id: String(drawId) }
        }),

    // 📅 DATE COMMANDS
    navigateDate: (currentDate: Date, days: number): Cmd => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + days);

        // Check if future using Trusted Time (SSOT)
        const trustedNow = TimerRepository.getTrustedNow(Date.now());
        const today = new Date(trustedNow);
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(nextDate);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate > today) return Cmd.none;

        return Cmd.ofMsg({
            type: 'SET_SELECTED_DATE',
            date: nextDate
        });
    },

    confirmDraw: (drawId: number): Cmd =>
        Cmd.task({
            task: async () => {
                // TODO: Implementar confirmación real en repository si existe
                // await structureRepository.confirmDraw(drawId);
                console.log('Confirming draw:', drawId);
                return true;
            },
            onSuccess: () => ({ type: 'FETCH_DETAILS_REQUESTED' }),
            onFailure: (error: any) => {
                console.error('Error confirming draw:', error);
                return { type: 'NO_OP' }; // Or a specific error message
            },
            label: 'confirmDraw'
        }),

    setWinningNumber: (drawId: number, winningNumber: string): Cmd =>
        Cmd.task({
            task: async () => {
                const today = new Date().toISOString().split('T')[0];
                const { drawRepository } = await import('@/shared/repositories/draw');
                return await drawRepository.addWinningNumbers(drawId, {
                    winning_number: winningNumber,
                    date: today
                });
            },
            onSuccess: () => ({ type: 'FETCH_DETAILS_REQUESTED' }),
            onFailure: (error: any) => {
                console.error('Error setting winning number:', error);
                return { type: 'NO_OP' };
            },
            label: 'setWinningNumber'
        })
};
