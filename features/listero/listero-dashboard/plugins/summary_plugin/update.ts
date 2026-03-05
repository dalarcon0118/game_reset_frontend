import { Model } from './model';
import * as Msg from './msg';
import { Return, ret } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData, WebData } from '@/shared/core/remote.data';
import { match } from 'ts-pattern';
import { FinancialSummary as DomainFinancialSummary, PendingBet as DomainPendingBet, DailyTotals } from './domain/models';

// Importar casos de usos limpios (sin dependencias de infraestructura global)
import { LoadPreferencesUseCase, LoadPreferencesResult } from './application/useCases/load-preferences-simple.use-case';
import { GetFinancialDataUseCase } from './application/useCases/get-financial-data.use-case';
import { FinancialCalculatorService } from './domain/services/financial-calculator.service';
import { TimeRangeService } from './domain/services/time-range.service';

import { SummaryPluginContext } from './domain/services';
import { validatePluginContext } from './context.validator';

import { FinancialSummaryExternalCodec, decodeOrFallback } from './domain/codecs';
import logger from '@/shared/utils/logger';

// Instanciar servicios de dominio (sin dependencias externas)
const financialCalculator = new FinancialCalculatorService();
const timeRangeService = new TimeRangeService();

// Instanciar casos de uso
const loadPreferencesUseCase = new LoadPreferencesUseCase();
const getFinancialDataUseCase = new GetFinancialDataUseCase(financialCalculator, timeRangeService);

const log = logger.withTag('[SummaryPlugin][Update]');

export const update = (model: Model, msg: Msg.Msg): Return<Model, Msg.Msg> => {
  return match<Msg.Msg, Return<Model, Msg.Msg>>(msg)
    .with({ type: 'INIT_CONTEXT' }, (m) =>
      handleInitContext(model, m.payload))

    .with({ type: 'LOAD_PREFERENCES' }, () =>
      handleLoadPreferences(model))

    .with({ type: 'PREFERENCES_LOADED' }, (m) =>
      handlePreferencesLoaded(model, m.payload))

    .with({ type: 'FETCH_FINANCIAL_SUMMARY' }, () =>
      handleFetchFinancialSummary(model))

    .with({ type: 'FINANCIAL_SUMMARY_RECEIVED' }, (m) =>
      handleFinancialSummaryReceived(model, m.payload))

    .with({ type: 'PENDING_BETS_RECEIVED' }, (m) =>
      handlePendingBetsReceived(model, m.payload))

    .with({ type: 'CALCULATE_DAILY_TOTALS' }, () =>
      handleCalculateDailyTotals(model))

    .with({ type: 'DAILY_TOTALS_CALCULATED' }, (m) =>
      handleDailyTotalsCalculated(model, m.payload))

    .with({ type: 'TOGGLE_BALANCE_VISIBILITY' }, () =>
      handleToggleBalanceVisibility(model))

    .with({ type: 'NOOP' }, () =>
      ret(model, Cmd.none))

    .with({ type: 'FETCH_PENDING_BETS' }, () =>
      ret(model, Cmd.none))

    .exhaustive();
};

// Handlers separados siguiendo SRP

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
      const result = await loadPreferencesUseCase.execute(model.context!);
      return Msg.PREFERENCES_LOADED(result);
    },
    onSuccess: (msg: Msg.Msg) => msg,
    onFailure: () => Msg.PREFERENCES_LOADED({
      userProfile: { id: 'unknown', name: 'Usuario', structureId: '1', commissionRate: 0.1 },
      userPreferences: { showBalance: true }
    })
  }));
}

function handlePreferencesLoaded(model: Model, payload: LoadPreferencesResult): Return<Model, Msg.Msg> {
  return ret({
    ...model,
    showBalance: payload.userPreferences.showBalance,
    commissionRate: payload.userProfile.commissionRate,
    structureId: payload.userProfile.structureId
  }, Cmd.ofMsg(Msg.FETCH_FINANCIAL_SUMMARY()));
}

// ... (en la función handleFetchFinancialSummary)

function handleFetchFinancialSummary(model: Model): Return<Model, Msg.Msg> {
  if (!model.context || !model.structureId) return ret(model, Cmd.none);

  return ret(
    { ...model, financialSummary: RemoteData.loading() },
    RemoteDataHttp.fetch<DomainFinancialSummary, Msg.Msg>(
      async () => {
        // Usamos getFinancialDataUseCase en lugar de llamar al servicio directamente
        // Esto centraliza la lógica y el manejo de errores/offline
        const result = await getFinancialDataUseCase.execute({
          structureId: model.structureId!,
          commissionRate: model.commissionRate,
          context: model.context!
        });
        // El caso de uso ahora garantiza que financialSummary nunca es null (retorna 0s por defecto)
        // por lo que podemos retornar directamente.
        return result.financialSummary!;
      },
      Msg.FINANCIAL_SUMMARY_RECEIVED
    )
  );
}

function handleFinancialSummaryReceived(model: Model, webData: WebData<DomainFinancialSummary>): Return<Model, Msg.Msg> {
  const nextModel = { ...model, financialSummary: webData };

  if (webData.type === 'Success') {
    return ret(nextModel, Cmd.ofMsg(Msg.CALCULATE_DAILY_TOTALS()));
  }

  return ret(nextModel, Cmd.none);
}

function handlePendingBetsReceived(model: Model, webData: WebData<DomainPendingBet[]>): Return<Model, Msg.Msg> {
  const nextModel = { ...model, pendingBets: webData };

  if (webData.type === 'Success') {
    return ret(nextModel, Cmd.ofMsg(Msg.CALCULATE_DAILY_TOTALS()));
  }

  return ret(nextModel, Cmd.none);
}

function handleCalculateDailyTotals(model: Model): Return<Model, Msg.Msg> {
  if (!model.context || !model.structureId) return ret(model, Cmd.none);

  return ret(
    model,
    RemoteDataHttp.fetch<DailyTotals, Msg.Msg>(
      async () => {
        const result = await getFinancialDataUseCase.execute({
          structureId: model.structureId,
          commissionRate: model.commissionRate,
          context: model.context!
        });
        return result.dailyTotals;
      },
      Msg.DAILY_TOTALS_CALCULATED
    )
  );
}

function handleDailyTotalsCalculated(model: Model, webData: WebData<DailyTotals>): Return<Model, Msg.Msg> {
  if (webData.type === 'Success') {
    return ret({ ...model, dailyTotals: webData.data }, Cmd.none);
  }
  return ret(model, Cmd.none);
}

function handleToggleBalanceVisibility(model: Model): Return<Model, Msg.Msg> {
  if (!model.context) return ret(model, Cmd.none);

  const newShowBalance = !model.showBalance;

  return ret(
    { ...model, showBalance: newShowBalance },
    Cmd.task({
      task: async () => {
        await model.context!.storage.setItem('showBalance', newShowBalance);
        return Msg.NOOP();
      },
      onSuccess: (msg) => msg,
      onFailure: () => Msg.NOOP()
    })
  );
}
