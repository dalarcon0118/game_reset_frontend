import { ExtendedDrawType, BackendDraw } from './types';

const SERVER_TIME_ZONE = 'America/New_York';

const hasTimeZoneInfo = (value: string) => /([zZ]|[+\-]\d{2}:\d{2})$/.test(value);

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );

  return (asUtc - date.getTime()) / 60000;
};

export const parseServerDateTime = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const direct = new Date(value);
  if (hasTimeZoneInfo(value) && !Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!match) {
    return Number.isNaN(direct.getTime()) ? null : direct;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? '0');
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getTimeZoneOffsetMinutes(new Date(utcGuess), SERVER_TIME_ZONE);
  return new Date(utcGuess - offset * 60_000);
};

const formatLocalTime = (utcTimestamp: string | null | undefined): string => {
  if (!utcTimestamp) return 'N/A';
  try {
    const date = parseServerDateTime(utcTimestamp);
    if (!date) return 'N/A';
    if (isNaN(date.getTime())) return 'N/A';
    
    // Al no especificar timeZone, toLocaleTimeString usará automáticamente 
    // la zona horaria local configurada en el dispositivo (ej. São Paulo).
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return 'N/A';
  }
};

const formatLocalDate = (utcTimestamp: string | null | undefined): string => {
  if (!utcTimestamp) return 'N/A';
  try {
    const date = parseServerDateTime(utcTimestamp);
    if (!date) return 'N/A';
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
): 'open' | 'pending' | 'closed' | 'scheduled' => {
  if (backendStatus === 'completed' || backendStatus === 'cancelled') {
    return 'closed';
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
    date: formatLocalDate(backendDraw.draw_datetime),
    time: formatLocalTime(backendDraw.draw_datetime),
    betting_start_time_display: formatLocalTime(backendDraw.betting_start_time),
    betting_end_time_display: formatLocalTime(backendDraw.betting_end_time)
  };
};
