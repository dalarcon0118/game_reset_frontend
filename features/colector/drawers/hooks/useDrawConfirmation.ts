import { useCallback } from 'react';
import { DrawService, DrawClosureConfirmation } from '@/shared/services/Draw';
import { ListeroDetails } from '@/shared/services/Structure';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { useAuth } from '../../../auth';

interface UseDrawConfirmationProps {
    onSuccess: () => void;
    details?: ListeroDetails | null;
}

export const useDrawConfirmation = ({ onSuccess, details }: UseDrawConfirmationProps) => {
    const { confirmAction } = useConfirmation();
    const { user } = useAuth();

    const confirmDraw = useCallback(async (drawId: number) => {
        // Find draw name for success message
        const drawName = details?.draws.find(d => d.draw_id === drawId)?.draw_name || String(drawId);

        try {
            // First, create closure confirmations for this draw if they don't exist
            const confirmations = await DrawService.createClosureConfirmationsForDraw(drawId);

            // Find the confirmation for the current user's structure (collector)
            // Use user's structure information instead of hardcoded values
            const userLevel = user?.structure?.role_in_structure === 'collector' ? 1 : null;
            const userStructureType = user?.structure?.type === 'COLLECTOR' ? 'LISTERO' : null;

            const collectorConfirmation = confirmations.find(conf => {
                // Match by level if user has collector role
                if (userLevel && conf.level_required === userLevel) return true;
                // Match by structure type if user has collector structure type
                if (userStructureType && conf.structure_type === userStructureType) return true;
                return false;
            });

            if (collectorConfirmation) {
                // Confirm the collector's closure with success status
                await DrawService.confirmClosure(
                    collectorConfirmation.id,
                    'confirmed_success',
                    'Confirmado exitosamente por el colector'
                );
            }

            // Call success callback
            onSuccess();

        } catch (error) {
            console.error('Error confirming draw closure:', error);
            throw error; // Re-throw to be handled by confirmation dialog
        }
    }, [onSuccess, details, user]);

    const confirmDrawWithDialog = useCallback((drawId: number) => {
        // Find draw name for success message
        const drawName = details?.draws.find(d => d.draw_id === drawId)?.draw_name || String(drawId);

        confirmAction({
            title: "Confirmar Cierre de Sorteo",
            message: `¿Confirma que el sorteo "${drawName}" se cerró correctamente? Esta acción será revisada por niveles superiores.`,
            onConfirm: () => confirmDraw(drawId),
            onSuccess,
            successMessage: `Cierre del sorteo "${drawName}" confirmado exitosamente`,
            errorMessage: "No se pudo confirmar el cierre del sorteo"
        });
    }, [confirmAction, confirmDraw, onSuccess, details]);

    const reportDrawIssue = useCallback(async (drawId: number, issueDescription: string) => {
        try {
            // Create closure confirmations if they don't exist
            const confirmations = await DrawService.createClosureConfirmationsForDraw(drawId);

            // Find the confirmation for the current user's structure
            const userLevel = user?.structure?.role_in_structure === 'collector' ? 1 : null;
            const userStructureType = user?.structure?.type === 'COLLECTOR' ? 'LISTERO' : null;

            const userConfirmation = confirmations.find(conf => {
                // Match by level if user has collector role
                if (userLevel && conf.level_required === userLevel) return true;
                // Match by structure type if user has collector structure type
                if (userStructureType && conf.structure_type === userStructureType) return true;
                return false;
            });

            if (userConfirmation) {
                // Report issue with the draw
                await DrawService.confirmClosure(
                    userConfirmation.id,
                    'reported_issue',
                    issueDescription
                );
            }

            onSuccess();

        } catch (error) {
            console.error('Error reporting draw issue:', error);
            throw error;
        }
    }, [onSuccess, user]);

    const reportDrawIssueWithDialog = useCallback((drawId: number) => {
        const drawName = details?.draws.find(d => d.draw_id === drawId)?.draw_name || String(drawId);

        // This would typically open a dialog to input the issue description
        // For now, we'll use a simple confirm with a note about reporting issues
        confirmAction({
            title: "Reportar Problema en Sorteo",
            message: `¿Desea reportar un problema con el sorteo "${drawName}"? Esta acción será revisada por el banco.`,
            onConfirm: () => reportDrawIssue(drawId, 'Problema reportado por el colector - requiere revisión'),
            onSuccess,
            successMessage: `Problema reportado para el sorteo "${drawName}"`,
            errorMessage: "No se pudo reportar el problema"
        });
    }, [confirmAction, reportDrawIssue, onSuccess, details]);

    return {
        confirmDraw: confirmDrawWithDialog,
    };
};
