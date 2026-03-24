import { scenario } from '@/tests/core';
import { TestContext } from '@/tests/core/context';
import { PersistenceLogic } from '@/features/listero/bet-loteria/core/domain/persistence.logic';
import { initialModel } from '@/features/listero/bet-loteria/core/feature.initial';
import { LoteriaFeatureModel } from '@/features/listero/bet-loteria/core/feature.types';
import { BetPlacementInput } from '@/shared/repositories/bet/bet.types';
import { RemoteData } from '@core/tea-utils';
import { Result } from 'neverthrow';

interface LoteriaResolutionContext extends TestContext {
    data: {
        model: LoteriaFeatureModel;
        drawId: string;
        result?: Result<BetPlacementInput[], Error>;
    };
}

const makeModel = () => ({
    ...initialModel,
    structureId: '101',
    entrySession: {
        loteria: [
            { id: 'bet-1', bet: '1234', amount: 100 },
            { id: 'bet-2', bet: '5678', amount: 50 }
        ]
    }
});

scenario<LoteriaResolutionContext>('Lotería persistencia resuelve betTypeId desde catálogo dinámico (SSOT)', {
    data: {
        model: makeModel(),
        drawId: '395'
    }
})
    .given('un modelo de lotería con catálogo dinámico cargado', (ctx) => {
        ctx.data.model.managementSession.betTypes = RemoteData.success([
            { id: 42, name: 'CUATERNA', code: 'CUATERNA' } as any
        ]);
    })
    .when('se prepara el payload para persistencia', (ctx) => {
        ctx.data.result = PersistenceLogic.createSavePayload(ctx.data.model, ctx.data.drawId);
    })
    .then('el resultado debe ser válido y usar el ID del catálogo', (ctx) => {
        expect(ctx.data.result?.isOk()).toBe(true);
        const payload = ctx.data.result?._unsafeUnwrap()!;
        expect(payload).toHaveLength(2);
        payload.forEach(bet => {
            expect(bet.betTypeId).toBe('42');
            expect(bet.type).toBe('Lotería');
        });
    })
    .test();

scenario<LoteriaResolutionContext>('Lotería persistencia falla si el catálogo dinámico no está cargado', {
    data: {
        model: makeModel(),
        drawId: '395'
    }
})
    .given('un modelo de lotería sin catálogo (NotAsked)', (ctx) => {
        ctx.data.model.managementSession.betTypes = RemoteData.notAsked();
    })
    .when('se prepara el payload para persistencia', (ctx) => {
        ctx.data.result = PersistenceLogic.createSavePayload(ctx.data.model, ctx.data.drawId);
    })
    .then('el resultado debe ser un error indicando que el catálogo es obligatorio', (ctx) => {
        expect(ctx.data.result?.isErr()).toBe(true);
        expect(ctx.data.result?._unsafeUnwrapErr().message).toContain('catálogo debe estar cargado');
    })
    .test();

scenario<LoteriaResolutionContext>('Lotería persistencia falla si no se encuentra el tipo LOTERIA en el catálogo', {
    data: {
        model: makeModel(),
        drawId: '395'
    }
})
    .given('un catálogo que solo contiene otros juegos', (ctx) => {
        ctx.data.model.managementSession.betTypes = RemoteData.success([
            { id: 1, name: 'FIJO', code: 'FIJO' } as any
        ]);
    })
    .when('se prepara el payload para persistencia', (ctx) => {
        ctx.data.result = PersistenceLogic.createSavePayload(ctx.data.model, ctx.data.drawId);
    })
    .then('el resultado debe ser un error indicando que no se encontró la configuración', (ctx) => {
        expect(ctx.data.result?.isErr()).toBe(true);
        expect(ctx.data.result?._unsafeUnwrapErr().message).toContain('Configuración de Lotería no encontrada');
    })
    .test();
