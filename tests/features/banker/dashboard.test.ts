/**
 * Test de integración del Dashboard del Banquero
 * 
 * Este test ejecuta el escenario BDD completo definido en dashboard.scenario.ts,
 * verificando que se cumplan todos los criterios de aceptación de la UH.
 */

import { bankerDashboardScenario } from './scenarios/dashboard.scenario';

// Ejecutar el scenario como test de Jest
bankerDashboardScenario.test();
