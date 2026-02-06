import { Cmd, CommandDescriptor } from '@/shared/core/cmd';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { DrawService } from '@/shared/services/draw';
import { GameType } from '@/types';
import { WebData } from '@/shared/core/remote.data';
import { ListActions } from '@/features/listero/bets/features/management/management.utils';
import { ManagementMsgType } from '@/features/listero/bets/features/management/management.types';
import { CoreMsgType } from '@/features/listero/bets/core/msg';
import { RewardsRulesMsgType } from '@/features/listero/bets/features/rewards-rules/rewards.types';

/**
 * Configuration Object Pattern para estrategias de carga de datos
 * 
 * Ventajas:
 * - ✅ Más simple que Strategy Pattern completo
 * - ✅ Declarativo y autodocumentado
 * - ✅ Type-safe con TypeScript
 * - ✅ Fácil extensión sin modificar código existente
 * - ✅ Aplicación del Principio de Responsabilidad Única
 */

export const VIEW_CONFIGS = {
  annotation: {
    fetchBetTypes: true,
    fetchExistingBets: false,
    fetchRules: true,
    fetchDrawInfo: true,
    description: 'Modo anotación - carga solo metadata necesaria',
    purpose: 'Para pantallas de entrada/anotación como BolitaEntryScreen'
  },
  list: {
    fetchBetTypes: true,
    fetchExistingBets: true,
    fetchRules: true,
    fetchDrawInfo: true,
    description: 'Modo lista - carga completa de datos del backend',
    purpose: 'Para pantallas de listado/visualización como BetsListScreen'
  }
} as const;

export type ViewMode = keyof typeof VIEW_CONFIGS;

/**
 * Valida que el modo de vista sea válido
 */
export function validateViewMode(mode: string): asserts mode is ViewMode {
  if (!(mode in VIEW_CONFIGS)) {
    throw new Error(`Modo de vista inválido: ${mode}. Modos válidos: ${Object.keys(VIEW_CONFIGS).join(', ')}`);
  }
}

/**
 * Construye comandos de fetching basados en el modo de vista
 * Aplicación del Principio de Responsabilidad Única:
 * - Esta función tiene UNA sola responsabilidad: construir comandos
 * - No contiene lógica de negocio condicional compleja
 * - Es pura y determinista
 */
export function buildCommandsForMode(mode: ViewMode, drawId: string): CommandDescriptor[] {
  const config = VIEW_CONFIGS[mode];
  const commands: CommandDescriptor[] = [];

  // Siempre cargar info del draw para registro de componentes
  if (config.fetchDrawInfo) {
    const drawInfoCmd = RemoteDataHttp.fetch(
      async () => {
        const draw = await DrawService.getOne(drawId);
        if (!draw) {
          throw new Error('No se encontró el sorteo');
        }
        if (!draw.draw_type_details?.code) {
          throw new Error('El sorteo no tiene código de tipo');
        }
        return draw.draw_type_details.code;
      },
      (webData: WebData<string>) => ({
        type: 'CORE',
        payload: { type: CoreMsgType.DRAW_INFO_RECEIVED, webData }
      })
    );
    commands.push(drawInfoCmd);
  }

  // Cargar tipos de apuestas si es necesario
  if (config.fetchBetTypes) {
    const betTypesCmd = RemoteDataHttp.fetch(
      () => DrawService.getBetTypes(drawId) as Promise<GameType[]>,
      (response: WebData<GameType[]>) => ({
        type: 'MANAGEMENT',
        payload: {
          type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE,
          response
        }
      })
    );
    commands.push(betTypesCmd);
  }

  // Manejar apuestas existentes
  if (config.fetchExistingBets) {
    commands.push(ListActions.fetchBets(drawId));
  } else {
    commands.push(ListActions.resetBets());
  }

  // Cargar reglas de validación si es necesario
  if (config.fetchRules) {
    const rulesCmd = {
      type: 'MSG' as const,
      payload: {
        type: 'REWARDS_RULES',
        payload: {
          type: RewardsRulesMsgType.FETCH_RULES_REQUESTED,
          drawId
        }
      }
    };
    commands.push(rulesCmd);
  }

  return commands;
}