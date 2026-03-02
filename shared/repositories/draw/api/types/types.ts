import { DrawType } from '@/types';

export interface BackendDraw {
  id: number;
  draw_type: number;
  draw_type_details: {
    id: number;
    name: string;
    description: string | null;
    code: string;
  };
  total_collected: number | string;
  premiums_paid: number | string;
  net_result: number | string;
  name: string;
  description: string | null;
  draw_datetime: string;
  betting_start_time: string | null;
  betting_end_time: string | null;
  status: string;
  owner_structure: number;
  winning_numbers: any | null;
  created_at: string;
  updated_at: string;
  hierarchical_closure_status: string | null;
  closure_confirmations_count: {
    total: number;
    pending: number;
    confirmed_success: number;
    reported_issue: number;
    rejected: number;
  };
  is_betting_open: boolean;
  extra_data: any;
}

export interface ExtendedDrawType extends DrawType {
  hierarchical_closure_status?: string | null;
  closure_confirmations_count?: {
    total: number;
    pending: number;
    confirmed_success: number;
    reported_issue: number;
    rejected: number;
  };
  is_betting_open?: boolean;
  draw_type_details?: {
    id: number;
    name: string;
    description: string | null;
    code: string;
  };
}

export interface DrawClosureConfirmation {
  id: number;
  draw: number;
  structure: number;
  structure_name: string;
  structure_type: string;
  confirmed_by: number;
  confirmed_by_name: string;
  draw_name: string;
  status: 'pending' | 'confirmed_success' | 'reported_issue' | 'rejected';
  notes: string;
  level_required: number;
  is_mandatory: boolean;
  requires_notification: boolean;
  created_at: string;
  updated_at: string;
}

export interface BetType {
  id: number;
  name: string;
  description?: string;
  code?: string;
}

export interface DrawRule {
  id: number;
  name: string;
  description?: string;
  value?: any;
}
