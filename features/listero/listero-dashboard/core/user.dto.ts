import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { logger } from '@/shared/utils/logger';
import { createCommissionRate } from '@/shared/domain/commission.rate';

const log = logger.withTag('DASHBOARD_USER_DTO');

// 1. ASTUTE TYPES: Normalizers that try to fix data before rejecting it

// Force any input to String (unless null/undefined)
const StrictString = new t.Type<string, unknown, unknown>(
    'StrictString',
    (u): u is string => typeof u === 'string',
    (u, c) => {
        if (typeof u === 'string') return t.success(u);
        if (typeof u === 'number') return t.success(String(u));
        return t.failure(u, c);
    },
    (a) => a
);

// Force any input to Number
const StrictNumber = new t.Type<number, unknown, unknown>(
    'StrictNumber',
    (u): u is number => typeof u === 'number' && !isNaN(u),
    (u, c) => {
        if (typeof u === 'number' && !isNaN(u)) return t.success(u);
        if (typeof u === 'string') {
            const n = parseFloat(u);
            return !isNaN(n) ? t.success(n) : t.failure(u, c);
        }
        return t.failure(u, c);
    },
    (a) => a
);

// 2. THE CONTRACT: What the Dashboard ABSOLUTELY needs to function
export const DashboardUserContract = t.type({
    id: StrictString,
    username: t.string,
    // We don't enforce specific role string here to avoid coupling with other modules,
    // but we ensure it exists as a string.
    role: t.string,

    // Structure details are MANDATORY for the dashboard to work.
    // If a user has no structure, they shouldn't be on the dashboard.
    structureId: StrictString,
    commissionRate: StrictNumber,

    // Optional display name
    name: t.union([t.string, t.undefined]),
});

export type DashboardUser = t.TypeOf<typeof DashboardUserContract>;

// 3. THE ADAPTER: The "Bouncer" logic
export const adaptAuthUser = (rawUser: any): DashboardUser | null => {
    // Fail fast on null
    if (!rawUser) {
        log.debug('adaptAuthUser: rawUser is null/undefined');
        return null;
    }

    // Log raw user structure for debugging
    log.debug('[DIAGNOSTIC] adaptAuthUser: rawUser structure details', {
        id: rawUser.id,
        username: rawUser.username,
        structure: rawUser.structure,
        commission_rate: rawUser.structure?.commission_rate
    });

    // 1. Flatten & Normalize
    // We extract exactly what we need, ignoring extra garbage fields.
    // We handle nested structure nullability here before validation.
    // SSOT: Using CommissionRate VO for consistent normalization
    const normalizedCommissionRate = createCommissionRate(
        rawUser.structure?.commission_rate ?? rawUser.commission_rate
    );

    // TOLERANCE: Try multiple fields for structureId to avoid failure when data shape varies
    let structureId = rawUser.structure?.id;
    if (!structureId) {
        structureId = rawUser.structureId || rawUser.structure?._id || null;
    }

    const candidate = {
        id: rawUser.id,
        username: rawUser.username,
        role: rawUser.role,
        name: rawUser.name,
        // Map nested structure fields to flat DTO
        structureId,
        commissionRate: normalizedCommissionRate
    };

    console.log('[DIAGNOSTIC][adaptAuthUser] Valor de commissionRate normalizado:', {
        rawCommissionRate: rawUser.structure?.commission_rate ?? rawUser.commission_rate,
        normalizedCommissionRate,
        userId: rawUser.id,
        username: rawUser.username
    });

    // 2. Validate against Contract
    const result = DashboardUserContract.decode(candidate);

    if (isLeft(result)) {
        // ASTUTE LOGGING: Don't just say "error". Say WHAT failed.
        const errors = PathReporter.report(result);
        log.warn('User rejected by Dashboard Contract', {
            errors,
            candidateId: candidate.id,
            hasStructure: !!rawUser.structure,
            candidateStructureId: candidate.structureId
        });
        return null;
    }

    // 3. Return Clean DTO
    return result.right;
};
