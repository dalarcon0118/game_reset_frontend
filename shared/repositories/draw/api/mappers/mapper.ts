import { ExtendedDrawType, BackendDraw } from '../types/types';
import { GameRegistry } from '../../../../core/registry/game_registry';

const formatLocalTime = (utcTimestamp: string | null | undefined): string => {
  if (!utcTimestamp) return 'N/A';
  try {
    const date = new Date(utcTimestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return 'N/A';
  }
};

const formatLocalDate = (utcTimestamp: string | null | undefined): string => {
  if (!utcTimestamp) return 'N/A';
  try {
    const date = new Date(utcTimestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-ES');
  } catch {
    return 'N/A';
  }
};

export const mapStatus = (
  backendStatus: string,
  bettingStart: string | null,
  bettingEnd: string | null,
  isBettingOpen?: boolean
): 'open' | 'pending' | 'closed' | 'scheduled' | 'rewarded' => {
  // Estados finales del backend
  if (backendStatus === 'completed' || backendStatus === 'cancelled') {
    return 'closed';
  }

  if (backendStatus === 'awarded') {
    return 'rewarded';
  }

  if (isBettingOpen === true) {
    return 'open';
  }

  if (bettingStart && bettingEnd) {
    const now = new Date();
    const start = new Date(bettingStart);
    const end = new Date(bettingEnd);

    if (now >= start && now <= end) {
      return 'open';
    } else if (now < start) {
      return 'scheduled';
    } else {
      return 'closed';
    }
  }

  return backendStatus === 'scheduled' ? 'scheduled' : 'closed';
};

export const mapBackendDrawToFrontend = (backendDraw: BackendDraw): ExtendedDrawType => {
  return {
    id: backendDraw.id.toString(),
    name: backendDraw.name,
    description: backendDraw.description,
    draw_datetime: backendDraw.draw_datetime,
    betting_start_time: backendDraw.betting_start_time,
    betting_end_time: backendDraw.betting_end_time,
    totalCollected: Number(backendDraw.total_collected) || 0,
    premiumsPaid: Number(backendDraw.premiums_paid) || 0,
    netResult: Number(backendDraw.net_result) || 0,
    status: mapStatus(
      backendDraw.status,
      backendDraw.betting_start_time,
      backendDraw.betting_end_time,
      backendDraw.is_betting_open
    ),
    draw_type: backendDraw.draw_type,
    draw_type_details: backendDraw.draw_type_details,
    owner_structure: backendDraw.owner_structure,
    winning_numbers: backendDraw.winning_numbers,
    created_at: backendDraw.created_at,
    updated_at: backendDraw.updated_at,
    extra_data: backendDraw.extra_data,
    hierarchical_closure_status: backendDraw.hierarchical_closure_status,
    closure_confirmations_count: backendDraw.closure_confirmations_count,
    is_betting_open: Boolean(backendDraw.is_betting_open),
    source: backendDraw.name,
    code: backendDraw.draw_type_details?.code || '',
    category: GameRegistry.getCategoryByDraw({
      code: backendDraw.draw_type_details?.code,
      name: backendDraw.name
    }),
    date: formatLocalDate(backendDraw.draw_datetime),
    time: formatLocalTime(backendDraw.draw_datetime)
  };
};
