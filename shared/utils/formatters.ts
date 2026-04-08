export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Returns YYYY-MM-DD in UTC time
 */
export const toUtcISODate = (timestamp: number): string => {
    return new Date(timestamp).toISOString().slice(0, 10);
};

/**
 * Returns YYYY-MM-DD in local time of the timestamp
 */
export const toLocalISODate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatServerTimeToLocal = (
    utcTimestamp: string | number | null | undefined,
    locale: string = 'es-ES'
): string => {
    if (!utcTimestamp) return 'N/A';
    try {
        const date = typeof utcTimestamp === 'string'
            ? new Date(utcTimestamp)
            : new Date(utcTimestamp);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return 'N/A';
    }
};

export const formatServerDateToLocal = (
    utcTimestamp: string | number | null | undefined,
    locale: string = 'es-ES'
): string => {
    if (!utcTimestamp) return 'N/A';
    try {
        const date = typeof utcTimestamp === 'string'
            ? new Date(utcTimestamp)
            : new Date(utcTimestamp);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString(locale);
    } catch {
        return 'N/A';
    }
};
