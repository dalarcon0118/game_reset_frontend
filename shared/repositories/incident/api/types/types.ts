export interface IncidentCreateData {
    structure: number;
    draw?: number | null;
    incident_type: string;
    description: string;
}

export interface BackendIncident extends IncidentCreateData {
    id: number;
    reporter: number;
    reporter_name: string;
    structure_name: string;
    draw_name?: string | null;
    status: 'pending' | 'in_review' | 'resolved' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export type Incident = BackendIncident;
