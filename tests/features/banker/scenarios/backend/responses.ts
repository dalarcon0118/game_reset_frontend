import { ChildStructure } from '@/shared/repositories/structure/structure.ports';

/**
 * 📝 Real-world JSON payloads for the Banker Dashboard simulation.
 * These match the backend's expected structure exactly.
 */

export const LOGIN_SUCCESS = {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token',
    user: {
        id: 1,
        username: 'jose',
        email: 'jose@bank.com',
        structure: {
            id: 54,
            name: 'BANCA-CENTRAL-01',
            type: 'bank'
        }
    }
};

export const STRUCTURE_CHILDREN: ChildStructure[] = [
    {
        id: 1,
        structure_id: 56,
        name: "Agencia-A",
        type: "listero",
        total_collected: 500.00,
        net_collected: 400.00,
        premiums_paid: 50.00,
        commissions: 50.00,
        draw_name: "Loteria Tarde",
        draw_ids: [101]
    },
    {
        id: 2,
        structure_id: 57,
        name: "Agencia-B",
        type: "listero",
        total_collected: 0.00,
        net_collected: 0.00,
        premiums_paid: 0.00,
        commissions: 0.00,
        draw_name: "Loteria Noche",
        draw_ids: [102]
    }
];
