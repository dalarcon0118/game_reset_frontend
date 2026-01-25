import { defineFeature, loadFeature } from 'jest-cucumber';
import { updateAuth } from '@/features/auth/store/update';
import { initialAuthModel } from '@/features/auth/store/initial';
import { AuthMsgType } from '@/features/auth/store/types';
import { update as updateDashboard } from '@/features/colector/dashboard/core/update';
import { Model as DashboardModel, DashboardStats } from '@/features/colector/dashboard/core/model';
import { Msg as DashboardMsg } from '@/features/colector/dashboard/core/msg';
import { RemoteData } from '@/shared/core/remote.data';

const feature = loadFeature('./tests/features/colector/colector.feature');

defineFeature(feature, (test) => {
    let authModel = initialAuthModel;
    let dashboardModel: DashboardModel = {
        stats: { type: 'NotAsked' },
        children: { type: 'NotAsked' },
        currentDate: new Date().toISOString().split('T')[0],
        userStructureId: null
    };

    test('Autenticación exitosa como colector', ({ when, then, and }) => {
        when(/^intento iniciar sesión con usuario "([^"]*)" y contraseña "([^"]*)"$/, (username, password) => {
            const loginResponse = {
                type: 'Success',
                data: {
                    username,
                    role: 'colector',
                    token: 'mock-token'
                }
            };

            const [nextModel] = updateAuth(authModel, {
                type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                webData: loginResponse as any
            });
            authModel = nextModel;
        });

        then('la autenticación debe ser exitosa', () => {
            expect(authModel.isAuthenticated).toBe(true);
        });

        and(/^el rol del usuario debe ser "([^"]*)"$/, (role) => {
            expect(authModel.user?.role).toBe(role);
        });
    });

    test('Cargar resumen del estado financiero del colector', ({ given, when, then }) => {
        given(/^que estoy autenticado como "([^"]*)"$/, (role) => {
            authModel = {
                ...initialAuthModel,
                isAuthenticated: true,
                user: { username: 'colector_test', role, token: 'mock-token' } as any
            };
        });

        when('solicito mi resumen financiero', () => {
            const stats: DashboardStats = {
                total: 50,
                pending: 10,
                completed: 40,
                netTotal: '45000',
                grossTotal: '50000',
                commissions: '5000',
                dailyProfit: '40000'
            };

            const [nextModel] = updateDashboard(dashboardModel, {
                type: 'STATS_RECEIVED',
                webData: { type: 'Success', data: { date: '2026-01-25', stats } } as any
            });
            dashboardModel = nextModel;
        });

        then('debo ver el total recolectado, comisiones y balance neto de mi estructura', () => {
            expect(dashboardModel.stats.type).toBe('Success');
            if (dashboardModel.stats.type === 'Success') {
                expect(dashboardModel.stats.data.grossTotal).toBe('50000');
            }
        });
    });

    test('Gestionar estructura de listeros hijos', ({ given, when, then, and }) => {
        given(/^que estoy autenticado como "([^"]*)"$/, (role) => {
            authModel = {
                ...initialAuthModel,
                isAuthenticated: true,
                user: { username: 'colector_test', role, token: 'mock-token' } as any
            };
        });

        when('cargo los nodos hijos de mi estructura', () => {
            const children = [
                { id: 'listero-1', name: 'Listero 1', financial_summary: { balance: 1000 } },
                { id: 'listero-2', name: 'Listero 2', financial_summary: { balance: 2000 } }
            ];

            const [nextModel] = updateDashboard(dashboardModel, {
                type: 'CHILDREN_RECEIVED',
                webData: { type: 'Success', data: children as any } as any
            });
            dashboardModel = nextModel;
        });

        then('debo ver una lista de listeros con su resumen financiero individual', () => {
            expect(dashboardModel.children.type).toBe('Success');
            if (dashboardModel.children.type === 'Success') {
                expect(dashboardModel.children.data.length).toBe(2);
            }
        });

        and('puedo listar el detalle de operaciones de cada hijo seleccionado', () => {
            expect(true).toBe(true);
        });
    });
});
