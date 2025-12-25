import { Incident } from '@/shared/services/Incident';

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
    // Map backend status to UI discrepancy status
    const statusMap: Record<string, Report['discrepancyStatus']> = {
        'pending': 'Abierto',
        'in_review': 'En proceso',
        'resolved': 'Resuelta',
        'cancelled': 'Cancelada'
    };

    return {
        id: String(incident.id),
        listeriaName: incident.structure_name,
        drawName: incident.draw_name || 'Sin Sorteo',
        date: new Date(incident.created_at).toLocaleDateString('es-DO', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        status: 'Discrepancia', // Assuming all reported incidents are discrepancies/issues
        discrepancyStatus: statusMap[incident.status] || 'Abierto',
        description: incident.description,
        incidentType: incident.incident_type
    };
};
