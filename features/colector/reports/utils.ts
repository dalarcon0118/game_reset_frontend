import { Incident } from '@/shared/services/incident';
import { match } from 'ts-pattern';

export interface Report {
    id: string;
    listeriaName: string;
    drawName: string;
    date: string;
    status: 'OK' | 'Discrepancia';
    discrepancyStatus?: 'Abierto' | 'En proceso' | 'Resuelta' | 'Cancelada';
    description: string;
    incidentType: string;
}

export const mapIncidentToReport = (incident: Incident): Report => {
    const discrepancyStatus = match(incident.status)
        .with('pending', () => 'Abierto' as const)
        .with('in_review', () => 'En proceso' as const)
        .with('resolved', () => 'Resuelta' as const)
        .with('cancelled', () => 'Cancelada' as const)
        .otherwise(() => 'Abierto' as const);

    return {
        id: String(incident.id),
        listeriaName: incident.structure_name,
        drawName: incident.draw_name || 'Sin Sorteo',
        date: new Date(incident.created_at).toLocaleDateString('es-DO', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        status: 'Discrepancia',
        discrepancyStatus,
        description: incident.description,
        incidentType: incident.incident_type
    };
};
