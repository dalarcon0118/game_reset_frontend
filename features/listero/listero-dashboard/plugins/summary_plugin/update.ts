import { Model } from './model';
import * as Msg from './msg';
import { Return, ret, Cmd, RemoteDataHttp, RemoteData, WebData } from '@/shared/core/tea-utils';
import { match } from 'ts-pattern';
import { FinancialSummary as DomainFinancialSummary, SummaryPluginContext } from './domain/models';
import { calculateFinancials } from './domain/logic';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { validatePluginContext } from './context.validator';
import logger from '@/shared/utils/logger';

export const update = (model: Model, msg: Msg.Msg): Return<Model, Msg.Msg> => {
  return match<Msg.Msg, Return<Model, Msg.Msg>>(msg)
    .with({ type: 'INIT_CONTEXT' }, (m) =>
      handleInitContext(model, m.payload))

    .with({ type: 'LOAD_PREFERENCES' }, () =>
      handleLoadPreferences(model))

    .with({ type: 'PREFERENCES_LOADED' }, (m) =>
      handlePreferencesLoaded(model, m.payload))

    .with({ type: 'GET_FINANCIAL_BETS' }, () =>
      handleGetFinancialBets(model))

    .with({ type: 'FINANCIAL_BETS_UPDATED' }, (m) =>
      handleFinancialBetsUpdated(model, m.payload))

    .with({ type: 'TOGGLE_BALANCE_VISIBILITY' }, () =>
      handleToggleBalanceVisibility(model))

    .with({ type: 'NOOP' }, () =>
      ret(model, Cmd.none))

    // Mensajes obsoletos mantenidos por compatibilidad de tipos si es necesario, 
    // pero ya no ejecutan lógica compleja.
    .with({ type: 'GET_PENDING_BETS' }, () => ret(model, Cmd.none))
    .with({ type: 'PENDING_BETS_UPDATED' }, () => ret(model, Cmd.none))
    .with({ type: 'CALCULATE_DAILY_TOTALS' }, () => ret(model, Cmd.none))
    .with({ type: 'DAILY_TOTALS_CALCULATED' }, () => ret(model, Cmd.none))

    .exhaustive();
};

// Handlers

function handleInitContext(model: Model, context: SummaryPluginContext): Return<Model, Msg.Msg> {
  const validation = validatePluginContext(context);

  if (!validation.isValid) {
    return ret({ ...model, contextError: validation.error || 'Unknown context error' }, Cmd.none);
  }

  return ret(
    { ...model, context, contextError: null },
    Cmd.ofMsg(Msg.LOAD_PREFERENCES())
  );
}

function handleLoadPreferences(model: Model): Return<Model, Msg.Msg> {
  if (!model.context) return ret(model, Cmd.none);

  return ret(model, Cmd.task({
    task: async () => {
      // Simplificado: Carga directa de preferencias desde el host storage
      const showBalance = await model.context!.storage.getItem('showBalance');
      return Msg.PREFERENCES_LOADED({
        userProfile: {
          id: 'me',
          name: 'Usuario',
          structureId: model.context!.state.userStructureId || '1',
          commissionRate: model.context!.state.commissionRate || 0.1
        },
        userPreferences: { showBalance: showBalance !== 'false' }
      });
    },
    onSuccess: (msg: Msg.Msg) => msg,
    onFailure: () => Msg.PREFERENCES_LOADED({
      userProfile: { id: 'unknown', name: 'Usuario', structureId: '1', commissionRate: 0.1 },
      userPreferences: { showBalance: true }
    })
  }));
}

function handlePreferencesLoaded(model: Model, payload: any): Return<Model, Msg.Msg> {
  return ret({
    ...model,
    showBalance: payload.userPreferences.showBalance,
    commissionRate: payload.userProfile.commissionRate,
    structureId: payload.userProfile.structureId
  }, Cmd.ofMsg(Msg.GET_FINANCIAL_BETS()));
}

function handleGetFinancialBets(model: Model): Return<Model, Msg.Msg> {
  if (!model.context || !model.structureId) return ret(model, Cmd.none);

  const todayStart = new Date().setHours(0, 0, 0, 0);

  return ret(
    { ...model, financialSummary: RemoteData.loading() },
    Cmd.task({
      task: async () => {
        // LLAMADA DIRECTA AL BET REPOSITORY (LA REALIDAD)
        const rawData = await betRepository.getFinancialSummary(todayStart, model.structureId);

        // CÁLCULO EN CALIENTE USANDO LÓGICA PURA
        const { summary } = calculateFinancials(
          {
            totalCollected: rawData.totalCollected,
            premiumsPaid: 0, // Las apuestas locales no tienen premios pagados aún
            betCount: rawData.betCount
          },
          model.commissionRate
        );

        return summary;
      },
      onSuccess: (data) => Msg.FINANCIAL_BETS_UPDATED(RemoteData.success(data)),
      onFailure: (error) => Msg.FINANCIAL_BETS_UPDATED(RemoteData.failure(error))
    })
  );
}

function handleFinancialBetsUpdated(model: Model, webData: WebData<DomainFinancialSummary>): Return<Model, Msg.Msg> {
  if (webData.type === 'Success') {
    // Al recibir el resumen, calculamos los totales diarios inmediatamente
    const { totals } = calculateFinancials(
      {
        totalCollected: webData.data.totalCollected,
        premiumsPaid: webData.data.premiumsPaid,
        betCount: 0 // No necesitamos el conteo aquí
      },
      model.commissionRate
    );

    return ret({
      ...model,
      financialSummary: webData,
      dailyTotals: totals
    }, Cmd.none);
  }

  return ret({ ...model, financialSummary: webData }, Cmd.none);
}

function handleToggleBalanceVisibility(model: Model): Return<Model, Msg.Msg> {
  if (!model.context) return ret(model, Cmd.none);

  const newShowBalance = !model.showBalance;

  return ret(
    { ...model, showBalance: newShowBalance },
    Cmd.task({
      task: async () => {
        await model.context!.storage.setItem('showBalance', String(newShowBalance));
        return Msg.NOOP();
      },
      onSuccess: (msg) => msg,
      onFailure: () => Msg.NOOP()
    })
  );
}
