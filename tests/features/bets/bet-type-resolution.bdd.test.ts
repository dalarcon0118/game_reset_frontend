import { scenario } from '@/tests/core';
import { TestContext } from '@/tests/core/context';
import { BolitaImpl } from '@/features/listero/bet-bolita/domain/bolita.impl';
import { initialBolitaModel } from '@/features/listero/bet-bolita/domain/models/bolita.initial';
import { BolitaModel } from '@/features/listero/bet-bolita/domain/models/bolita.types';
import { BetPlacementInput } from '@/shared/repositories/bet/bet.types';

type ValidationResult =
    | { type: 'Valid'; payload: BetPlacementInput[] }
    | { type: 'Invalid'; reason: string };

interface BetTypeResolutionContext extends TestContext {
    data: {
        model: BolitaModel;
        drawId: string;
        identifiedBetTypes?: Record<string, string | null>;
        result?: ValidationResult;
    };
}

const makeModel = () => ({
    ...initialBolitaModel,
    userStructureId: 101,
    summary: {
        ...initialBolitaModel.summary,
        grandTotal: 350,
        hasBets: true
    },
    entrySession: {
        fijosCorridos: [
            { id: 'fijo-1', bet: 12, fijoAmount: 100, corridoAmount: null },
            { id: 'corrido-1', bet: 34, fijoAmount: null, corridoAmount: 70 }
        ],
        parlets: [{ id: 'parlet-1', bets: [12, 34], amount: 80 }],
        centenas: [{ id: 'centena-1', bet: 123, amount: 100 }]
    }
});

const validateAndPrepareWithDynamicMap = (
    model: BolitaModel,
    drawId: string,
    identifiedBetTypes?: Record<string, string | null>
): ValidationResult => (
    BolitaImpl.persistence.validateAndPrepare as unknown as (
        inputModel: BolitaModel,
        inputDrawId: string,
        dynamicBetTypeIds?: Record<string, string | null>
    ) => ValidationResult
)(model, drawId, identifiedBetTypes);

const expectValidPayload = (result: ValidationResult): BetPlacementInput[] => {
    expect(result.type).toBe('Valid');
    if (result.type !== 'Valid') {
        throw new Error(`Resultado inválido inesperado: ${result.reason}`);
    }
    return result.payload;
};

const toBetTypeMap = (payload: BetPlacementInput[]): Map<string, string> =>
    new Map(payload.map((item) => [item.type, String(item.betTypeId)]));

const expectPayloadIntegrity = (payload: BetPlacementInput[]) => {
    expect(payload).toHaveLength(4);
    payload.forEach((item) => {
        expect(String(item.betTypeId)).toMatch(/^\d+$/);
    });
};

const expectExactBetTypeIds = (payload: BetPlacementInput[], expectedByType: Record<string, string>) => {
    const byType = toBetTypeMap(payload);
    expect(byType.size).toBe(Object.keys(expectedByType).length);
    Object.entries(expectedByType).forEach(([betType, expectedId]) => {
        expect(byType.get(betType)).toBe(expectedId);
    });
};

const LEGACY_IDS = new Set(['1', '2', '3', '4']);

scenario<BetTypeResolutionContext>('Bolita persistencia resuelve betTypeId desde mapa dinámico (RED)', {
    data: {
        model: makeModel(),
        drawId: '395',
        identifiedBetTypes: {
            FIJO: '6',
            CORRIDO: '7',
            PARLET: '8',
            CENTENA: '9'
        }
    }
})
    .given('un modelo válido de bolita con mapa dinámico code->id', (ctx) => {
        expect(ctx.data.model.userStructureId).toBe(101);
        expect(ctx.data.identifiedBetTypes?.FIJO).toBe('6');
    })
    .when('se prepara el payload para persistencia', (ctx) => {
        ctx.data.result = validateAndPrepareWithDynamicMap(
            ctx.data.model,
            ctx.data.drawId,
            ctx.data.identifiedBetTypes
        );
    })
    .then('cada tipo usa el id dinámico y rechaza cualquier id legacy', (ctx) => {
        const payload = expectValidPayload(ctx.data.result as ValidationResult);
        expectPayloadIntegrity(payload);
        expectExactBetTypeIds(payload, {
            Fijo: '6',
            Corrido: '7',
            Parlet: '8',
            Centena: '9'
        });
        payload.forEach((item) => {
            expect(LEGACY_IDS.has(String(item.betTypeId))).toBe(false);
        });
    })
    .test();

scenario<BetTypeResolutionContext>('Bolita persistencia falla si el mapa dinámico de betTypeId está incompleto (RED)', {
    data: {
        model: makeModel(),
        drawId: '395',
        identifiedBetTypes: {
            FIJO: '6',
            CORRIDO: '7',
            PARLET: null,
            CENTENA: '9'
        }
    }
})
    .when('se prepara el payload con mapa dinámico incompleto', (ctx) => {
        ctx.data.result = validateAndPrepareWithDynamicMap(
            ctx.data.model,
            ctx.data.drawId,
            ctx.data.identifiedBetTypes
        );
    })
    .then('el resultado debe ser inválido para evitar persistencia con ids inconsistentes', (ctx) => {
        expect(ctx.data.result?.type).toBe('Invalid');
    })
    .test();

scenario<BetTypeResolutionContext>('Bolita persistencia falla sin mapa dinámico para garantizar SSOT', {
    data: {
        model: makeModel(),
        drawId: '395'
    }
})
    .given('un modelo válido sin mapa dinámico', (ctx) => {
        expect(ctx.data.model.userStructureId).toBe(101);
    })
    .when('se prepara el payload para persistencia', (ctx) => {
        ctx.data.result = BolitaImpl.persistence.validateAndPrepare(ctx.data.model, ctx.data.drawId) as ValidationResult;
    })
    .then('el resultado debe ser inválido para evitar fallback legacy', (ctx) => {
        expect(ctx.data.result?.type).toBe('Invalid');
    })
    .test();
