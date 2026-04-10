import { settings } from '@/config/settings';

export interface PerformanceItem {
  name: string;
  bets_count: number;
  total_in: string;
  total_out: string;
  net: string;
  class_name: string;
  class_color: string;
  share: string;
}

export interface Hierarchy {
  top: PerformanceItem[];
  mid: PerformanceItem[];
  low: PerformanceItem[];
  inactive: PerformanceItem[];
  top_total: string;
  mid_total: string;
  low_total: string;
}

export interface Summary {
  total_collected: string;
  total_payout: string;
  commissions: string;
  expenses: string;
  net_profit: string;
  bets_count: number;
}

export interface BankReport {
  bank_name: string;
  summary: Summary;
  profit_margin: string;
  payout_ratio: string;
  avg_ticket: string;
  performance: PerformanceItem[];
  hierarchy: Hierarchy;
  is_filtered: boolean;
  period_label: string;
  period_type: string;
  date_filter: string;
  month_filter: string;
  year_filter: string;
  months_list: [number, string][];
  years_list: [number, string][];
}

export interface BankReportFilters {
  period_type?: 'all' | 'daily' | 'monthly';
  date?: string;
  month?: string;
  year?: string;
}

export const bankReportApi = {
  getReport: async (structureId: number, filters: BankReportFilters = {}): Promise<BankReport> => {
    const params = new URLSearchParams();

    if (filters.period_type) {
      params.append('period_type', filters.period_type);
    }
    if (filters.date) {
      params.append('date', filters.date);
    }
    if (filters.month) {
      params.append('month', filters.month);
    }
    if (filters.year) {
      params.append('year', filters.year);
    }

    const queryString = params.toString();
    const url = `${settings.api.baseUrl}/accounting/api/report/${structureId}/${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return response.json();
  },
};