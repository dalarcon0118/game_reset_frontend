/**
 * Test: Banker Dashboard - Integración Real con Mock Backend
 * 
 * Uso:
 *   npx jest dashboard.test.ts
 * 
 * Este archivo importa el scenario desde dashboard.scenario.ts
 * y lo ejecuta con .test()
 */

import { bankerDashboardScenario } from './dashboard.scenario';

// Ejecutar el scenario como test de Jest
bankerDashboardScenario.test();
