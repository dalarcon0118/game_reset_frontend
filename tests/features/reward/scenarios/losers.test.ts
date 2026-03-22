/**
 * Test: Losers - Verifica que las apuestas NO ganadoras NO reciben premio
 * 
 * Uso:
 *   npx jest losers.test.ts
 * 
 * Este archivo importa el scenario desde losers.scenario.ts
 * y lo ejecuta con .test()
 */

import { losersScenario } from './losers.scenario';

// Ejecutar el scenario como test de Jest
losersScenario.test();
