/**
 * Suite de Tests de Premiación
 * 
 * Orchestrador que importa y registra los scenarios desde archivos separados.
 * Permite ejecutar la suite completa o scenarios individuales.
 * 
 * Uso:
 *   npx jest frontend/tests/features/reward/suite.ts      # Ejecuta toda la suite
 *   npx jest frontend/tests/features/reward/scenarios/winners.test.ts  # Solo winners
 *   npx jest frontend/tests/features/reward/scenarios/losers.test.ts   # Solo losers
 */

import { createSuite } from '@/tests/core';
import { PremiacionContext, createPremiacionContext } from './scenarios/helpers';

// Importar escenarios desde archivos separados
// Los escenarios se definen en winners.scenario.ts y losers.scenario.ts
// Aquí los importamos para registrarlos en la suite
import { winnersScenario } from './scenarios/winners.scenario';
import { losersScenario } from './scenarios/losers.scenario';

/**
 * CREAR LA SUITE Y REGISTRAR LOS ESCENARIOS
 * 
 * Esta suite ejecuta:
 * 1. winnersScenario - Verifica que apuestas ganadoras reciben premio
 * 2. losersScenario  - Verifica que NO hay falsos positivos
 * 
 * La suite tiene setup/cleanup común que se ejecuta antes/después de TODOS los scenarios.
 */
const premiaciónSuite = createSuite<PremiacionContext>(
    'Suite Premiación',
    createPremiacionContext(),
    { timeout: 300000 }
)
    .beforeAll(async (ctx) => {
        console.log('🚀 Iniciando Suite de Premiación...');
    })
    .afterAll(async (ctx) => {
        console.log('🏁 Suite de Premiación completada');
    })
    // Registrar los escenarios importados (NO ejecuta .test() aquí)
    .register('Apuestas ganadoras reciben premio', winnersScenario)
    .register('Apuestas perdedoras NO reciben premio', losersScenario);

// Ejecutar la suite (genera describe + it en Jest)
premiaciónSuite.run();

export default premiaciónSuite;
