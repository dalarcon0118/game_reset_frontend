import { useCallback } from 'react';
import { DrawService } from '@shared/services/Draw';
import { ListeroDetails } from '@shared/services/Structure';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

interface UseDrawConfirmationProps {
    onSuccess: () => void;
    details?: ListeroDetails | null;
}

export const useDrawConfirmation = ({ onSuccess, details }: UseDrawConfirmationProps) => {
    const { confirmAction } = useConfirmation();

    const confirmDraw = useCallback((drawId: number) => {
        // Find draw name for success message
        const drawName = details?.draws.find(d => d.draw_id === drawId)?.draw_name || String(drawId);

        confirmAction({
            title: "Confirmar Sorteo",
            message: "¿Desea confirmar que todo está Ok con este sorteo?",
            onConfirm: async () => await DrawService.updateStatus(drawId, 'success'),
            onSuccess,
            successMessage: `Sorteo ${drawName} actualizado correctamente`,
            errorMessage: "No se pudo actualizar el sorteo"
        });
    }, [confirmAction, onSuccess, details]);

    return { confirmDraw };
};
