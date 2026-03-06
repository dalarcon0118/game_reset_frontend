import { Return, ret, singleton } from '@/shared/core/return';
import { Cmd } from '@/shared/core/tea-utils/cmd';
import { Model } from './model';
import * as Msg from './msg';
import { calculateLocalTotals, reconcile } from './core/reconciler';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FINANCIAL_INTEGRITY_PLUGIN');

export function update(msg: Msg.Msg, model: Model): Return<Model, Msg.Msg> {
  switch (msg.type) {
    case 'INIT_CONTEXT':
      return ret({ ...model, context: msg.payload }, Cmd.none);

    case 'SYNC_DATA': {
      const { allLocalBets, backendSummary, commissionRate } = msg.payload;

      const localTotals = calculateLocalTotals(allLocalBets, commissionRate);

      const backendTotals = {
        totalCollected: backendSummary?.total_colectado || 0,
        premiumsPaid: backendSummary?.total_pagado || 0,
        netResult: backendSummary?.total_neto || 0,
        estimatedCommission: (backendSummary?.total_colectado || 0) * commissionRate,
        amountToRemit: (backendSummary?.total_neto || 0) - ((backendSummary?.total_colectado || 0) * commissionRate),
      };

      return ret(
        {
          ...model,
          localTotals,
          backendTotals,
          commissionRate,
          lastSyncTimestamp: Date.now(),
          integrityStatus: 'SYNCING'
        },
        Cmd.ofMsg(Msg.PERFORM_RECONCILIATION())
      );
    }

    case 'PERFORM_RECONCILIATION': {
      const result = reconcile(model.localTotals, model.backendTotals);

      const nextModel = {
        ...model,
        integrityStatus: result.status,
        discrepancies: result.discrepancy
          ? [result.discrepancy, ...model.discrepancies].slice(0, 10)
          : model.discrepancies
      };

      if (result.status === 'MISMATCH' && result.discrepancy) {
        log.error('Financial Mismatch Detected!', result.discrepancy);
        return ret(
          nextModel,
          Cmd.ofMsg(Msg.REPORT_DISCREPANCY({
            localValue: result.discrepancy.localValue,
            backendValue: result.discrepancy.backendValue,
            delta: result.discrepancy.delta
          }))
        );
      }

      return ret(nextModel, Cmd.none);
    }

    case 'REPORT_DISCREPANCY':
      // Aquí podríamos disparar un comando TASK para enviar un reporte de auditoría al backend
      // o mostrar una notificación persistente a través del context.events.publish
      if (model.context) {
        return ret(model, Cmd.task({
          task: async () => {
            model.context?.events.publish('FINANCIAL_INTEGRITY_ALERT', msg.payload);
            return null;
          },
          onSuccess: () => Msg.NOOP(),
          onFailure: () => Msg.NOOP()
        }));
      }
      return ret(model, Cmd.none);

    default:
      return singleton(model);
  }
}
