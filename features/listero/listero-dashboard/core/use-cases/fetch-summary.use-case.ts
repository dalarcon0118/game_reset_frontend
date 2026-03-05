import { drawRepository } from '@/shared/repositories/draw';
import { financialRepository, FinancialKeys } from '@/shared/repositories/financial';
import { FinancialSummary, DrawType } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FETCH_SUMMARY_USE_CASE');

/**
 * Use Case: Obtener el resumen financiero (SSOT Local)
 * 
 * Calcula el resumen de cobros y premios directamente desde el Ledger local (FinancialRepository),
 * garantizando que los datos mostrados al listero sean coherentes con sus operaciones locales,
 * independientemente de la conexión.
 */
export const fetchSummaryUseCase = async (structureId: string): Promise<FinancialSummary> => {
    // SSOT: Usar financialRepository para obtener datos locales
    const structureFilter = FinancialKeys.forStructure(structureId);
    const totalCollected = await financialRepository.getCredits(structureFilter);
    const premiumsPaid = await financialRepository.getDebits(structureFilter);

    // Obtener los sorteos actuales para el desglose
    const drawsResult = await drawRepository.getDraws({ owner_structure: structureId, today: true });
    const drawsInfo = drawsResult.isOk() ? drawsResult.value : [];

    // Construir el desglose por sorteo desde el Ledger local
    const sorteos = await Promise.all(drawsInfo.map(async (draw: DrawType) => {
        const drawFilter = FinancialKeys.forDraw(structureId, draw.id);
        const drawCollected = await financialRepository.getCredits(drawFilter);
        const drawPaid = await financialRepository.getDebits(drawFilter);

        return {
            id: draw.id,
            name: draw.name,
            totalCollected: drawCollected,
            premiumsPaid: drawPaid,
            netResult: drawCollected - drawPaid,
            status: draw.status
        };
    }));

    const summary: FinancialSummary = {
        totalCollected,
        premiumsPaid,
        netResult: totalCollected - premiumsPaid,
        draws: sorteos,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        id_estructura: Number(structureId),
        nombre_estructura: 'Local (Offline)',
        colectado_total: totalCollected,
        pagado_total: premiumsPaid,
        neto_total: totalCollected - premiumsPaid,
        sorteos: sorteos
    };

    log.debug('Summary calculated from local SSOT', {
        totalCollected,
        premiumsPaid,
        sorteosCount: sorteos.length
    });

    return summary;
};
