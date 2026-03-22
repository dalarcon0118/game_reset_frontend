/**
 * Test: Winners - Verifica que las apuestas ganadoras reciben premio
 * 
 * Uso:
 *   npx jest winners.test.ts
 * 
 * Este archivo importa el scenario desde winners.scenario.ts
 * y lo ejecuta con .test()
 */

import { winnersScenario } from './winners.scenario';

// Ejecutar el scenario como test de Jest
winnersScenario.test();
