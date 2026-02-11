import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

export const BackendFinancialSummaryCodec = t.type({
  id_estructura: t.number,
  nombre_estructura: t.string,
  padre_id: t.union([t.number, t.null]),
  colectado_total: t.number,
  pagado_total: t.number,
  neto_total: t.number,
  sorteos: t.array(t.unknown),
});

export const NodeFinancialSummaryCodec = t.type({
  structure_id: t.number,
  date: t.string,
  total_collected: t.number,
  total_paid: t.number,
  total_net: t.number,
  commissions: t.number,
  draw_summary: t.string,
});

export const BackendDashboardStatsCodec = t.type({
    date: t.string,
    stats: t.unknown, // DashboardStats is complex, leaving as unknown for now or can be detailed
});

export const BackendFinancialStatementCodec = t.type({
    total_collected: t.string,
    total_paid: t.string,
    net_result: t.string,
    draw: t.unknown,
    owner_structure: t.unknown,
    date: t.string,
    level: t.string,
});

export const BackendFinancialStatementArrayCodec = t.array(BackendFinancialStatementCodec);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
  const result = codec.decode(value);
  if (isRight(result)) return result.right;
  console.warn(`[FinancialSummaryApi] ${label} decode failed:`, PathReporter.report(result).join('; '));
  return value as T;
};
