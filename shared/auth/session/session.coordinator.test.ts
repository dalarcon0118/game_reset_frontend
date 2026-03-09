import { SessionCoordinator } from './session.coordinator';
import { SessionSignalBus } from './session.signal.bus';
import { SessionSignalType } from './session.types';

const makeToken = (exp: number): string => {
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    return `header.${payload}.signature`;
};

const makeLogger = () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    withTag: function () {
        return this;
    }
});

describe('SessionCoordinator preventive refresh', () => {
    beforeEach(() => {
        (SessionCoordinator as any).instance = undefined;
    });

    test('deduplica refresh preventivo concurrente y publica un solo TOKEN_REFRESHED', async () => {
        const authRepo = {
            getToken: jest.fn().mockResolvedValue({
                access: makeToken(Math.floor(Date.now() / 1000) - 60),
                refresh: 'refresh-token'
            }),
            getUserIdentity: jest.fn().mockResolvedValue(null)
        } as any;

        const logger = makeLogger();
        const settings = { api: { endpoints: { public: [] } } } as any;
        const coordinator = SessionCoordinator.initialize(
            authRepo,
            settings,
            logger as any,
            () => 'AUTHENTICATED',
            jest.fn()
        );

        const bus = SessionSignalBus.getInstance();
        const signals: SessionSignalType[] = [];
        const unsubscribe = bus.subscribe((signal) => {
            signals.push(signal.type);
        });

        const refreshAction = jest.fn(
            () =>
                new Promise<string>((resolve) => {
                    setTimeout(() => resolve('new-access-token'), 25);
                })
        );

        await Promise.all([
            coordinator.onRequestAuthCheck('/bets/?draw=230', false, true, refreshAction),
            coordinator.onRequestAuthCheck('/draw/draws/230/', false, true, refreshAction),
            coordinator.onRequestAuthCheck('/notifications/', false, true, refreshAction)
        ]);

        unsubscribe();

        expect(refreshAction).toHaveBeenCalledTimes(1);
        expect(signals.filter((type) => type === SessionSignalType.TOKEN_REFRESHED)).toHaveLength(1);
        expect(signals.filter((type) => type === SessionSignalType.SESSION_EXPIRED)).toHaveLength(0);
    });

    test('publica SESSION_EXPIRED cuando falla refresh preventivo', async () => {
        const authRepo = {
            getToken: jest.fn().mockResolvedValue({
                access: makeToken(Math.floor(Date.now() / 1000) - 60),
                refresh: 'refresh-token'
            }),
            getUserIdentity: jest.fn().mockResolvedValue(null)
        } as any;

        const logger = makeLogger();
        const settings = { api: { endpoints: { public: [] } } } as any;
        const coordinator = SessionCoordinator.initialize(
            authRepo,
            settings,
            logger as any,
            () => 'AUTHENTICATED',
            jest.fn()
        );

        const bus = SessionSignalBus.getInstance();
        const signals: SessionSignalType[] = [];
        const unsubscribe = bus.subscribe((signal) => {
            signals.push(signal.type);
        });

        await coordinator.onRequestAuthCheck('/bets/?draw=230', false, true, async () => null);

        unsubscribe();

        expect(signals.filter((type) => type === SessionSignalType.TOKEN_REFRESHED)).toHaveLength(0);
        expect(signals.filter((type) => type === SessionSignalType.SESSION_EXPIRED)).toHaveLength(1);
    });
});
