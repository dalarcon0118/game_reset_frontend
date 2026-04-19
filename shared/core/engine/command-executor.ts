/**
 * Ejecutor de Comandos para el Motor TEA.
 * Maneja la validación, aplanamiento y ejecución de comandos.
 */

import { Cmd, CommandDescriptor } from '../tea-utils/cmd';
import { EffectHandler, MessageMeta } from './types';
import { MiddlewareChain } from './middleware-chain';
import { HandlerResolver } from './handler-resolver';
import { globalSignalBus } from '../tea-utils/signal_bus';
import { logger } from '../../utils/logger';

const log = logger.withTag('COMMAND_EXECUTOR');

// Flags de desarrollo
const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 *Opciones para el CommandExecutor
 */
export interface CommandExecutorOptions<TMsg> {
    /** Resolutor de handlers */
    handlerResolver: HandlerResolver<TMsg>;
    /** Chain de middlewares */
    middlewareChain: MiddlewareChain<any, TMsg>;
    /** Getter para obtener dispatch dinámicamente */
    getDispatch: () => (msg: TMsg) => void;
    /** Metadatos del mensaje padre */
    parentMeta?: MessageMeta;
}

/**
 * Ejecutor de comandos del Motor TEA.
 * Maneja la ejecución de efectos secundarios.
 */
export class CommandExecutor<TMsg> {
    constructor(
        private handlerResolver: HandlerResolver<TMsg>,
        private middlewareChain: MiddlewareChain<any, TMsg>,
        private getDispatch: () => (msg: TMsg) => void,
        private parentMeta?: MessageMeta
    ) { }

    /**
     * Obtiene el dispatch de forma dinámica con validación defensiva.
     */
    private dispatch(msg: TMsg): void {
        const dispatchFn = this.getDispatch();
        if (typeof dispatchFn !== 'function') {
            log.error('CRITICAL: dispatch is not a function in CommandExecutor.', {
                type: typeof dispatchFn,
                dispatch: dispatchFn,
                msg
            });
            // Fallback no-op to prevent fatal crash
            return;
        }
        dispatchFn(msg);
    }

    /**
     * Ejecuta un comando (o array de comandos)
     */
    execute(cmd: Cmd): void {
        const cmds = this.flattenCmds(cmd);
        cmds.forEach(singleCmd => this.executeSingle(singleCmd));
    }

    /**
     * Aplana comandos anidados en array plano
     */
    flattenCmds(cmd: Cmd): CommandDescriptor[] {
        if (!cmd) return [];
        
        // Debug: Log the raw command before flattening
        if (__DEV__ && typeof cmd === 'object') {
            const cmdStr = Array.isArray(cmd) 
                ? `[Array:${cmd.length}]` 
                : `type:${cmd.type}`;
            log.debug(`Flattening cmd:`, { cmdStr, rawCmd: cmd });
        }
        
        if (Array.isArray(cmd)) {
            return cmd.reduce(
                (acc, item) => acc.concat(this.flattenCmds(item)),
                [] as CommandDescriptor[]
            );
        }
        return [cmd];
    }

    /**
     * Ejecuta un comando individual
     */
    private executeSingle(singleCmd: CommandDescriptor): void {
        // Validación básica
        if (!singleCmd || typeof singleCmd !== 'object') {
            log.error(
                `Invalid command detected: expected object, got ${typeof singleCmd}`,
                'ENGINE_VALIDATION',
                { singleCmd }
            );
            return;
        }

        // Validación del tipo de comando (CRÍTICO para debuggear "undefined" errors)
        if (typeof singleCmd.type !== 'string' || !singleCmd.type) {
            log.error(
                `Invalid command type: expected non-empty string, got ${JSON.stringify(singleCmd.type)}`,
                'ENGINE_VALIDATION',
                { 
                    cmdType: singleCmd.type,
                    cmdTypeof: typeof singleCmd.type,
                    cmd: singleCmd,
                    payload: singleCmd.payload
                }
            );
            return;
        }

        // Detectar funciones pasadas como comandos (error común)
        if (typeof singleCmd === 'function') {
            const error = new Error(
                `[TEA_ENGINE] ERROR: Received a function instead of a CommandDescriptor. ` +
                `Did you forget to call a command creator like fetchXXXXCmd()? ` +
                `Source: ${(singleCmd as any).toString().substring(0, 100)}...`
            );
            log.error(error.message, 'ENGINE_VALIDATION', error);
            if (__DEV__) throw error;
            return;
        }

        // Resolver handler
        let handler = this.handlerResolver.getHandler(singleCmd.type);

        // Casos especiales: señales globales (TEA-agnósticos)
        if (singleCmd.type === 'SEND_MSG') {
            const { msg, options } = singleCmd.payload;
            globalSignalBus.send(msg, options);
            return;
        }

        if (singleCmd.type === 'CLEAR_STICKY') {
            globalSignalBus.clearSticky(singleCmd.payload);
            return;
        }

        // Ejecutar handler si existe
        if (handler) {
            this.executeWithHandler(singleCmd, handler);
        } else {
            this.logMissingHandler(singleCmd);
        }
    }

    /**
     * Ejecuta un comando con su handler
     */
    private async executeWithHandler(
        singleCmd: CommandDescriptor,
        handler: EffectHandler<TMsg>
    ): Promise<void> {
        const currentMeta = this.parentMeta || { traceId: 'DEFAULT', timestamp: Date.now() };

        // Middleware: beforeCmd
        this.middlewareChain.beforeCmd(singleCmd, currentMeta);

        try {
            const result = await handler(singleCmd.payload, this.dispatchWithMeta);

            // Si hay msgCreator, dispatch el mensaje resultante
            if (singleCmd.payload?.msgCreator) {
                this.dispatchWithMeta(singleCmd.payload.msgCreator(result));
            }
        } catch (error) {
            if (singleCmd.payload?.errorCreator) {
                this.dispatchWithMeta(singleCmd.payload.errorCreator(error));
            } else {
                log.error(
                    `Unhandled error in Cmd: ${singleCmd.type}`,
                    'ENGINE',
                    error,
                    { payload: singleCmd.payload }
                );
            }
        }
    }

    /**
     * Dispatch que propaga metadatos al mensaje hijo
     */
    private dispatchWithMeta = (nextMsg: TMsg): void => {
        // Solo dispatch mensajes válidos (objetos), skip primitivos undefined/null
        if (nextMsg && typeof nextMsg === 'object') {
            this.dispatch(nextMsg);
        } else if (nextMsg !== undefined) {
            log.warn('Dispatch received non-object message', 'ENGINE', { msg: nextMsg });
            this.dispatch(nextMsg);
        }
        // Silent skip para undefined - esperado cuando tasks no retornan nada
    };

    /**
     * Loguea cuando no se encuentra handler
     */
    private logMissingHandler(singleCmd: CommandDescriptor): void {
        const errorMsg = `No handler found for Cmd type: ${singleCmd.type}`;
        log.error(errorMsg, 'ENGINE_EXECUTION', {
            availableHandlers: this.handlerResolver.getAvailableHandlerNames(),
            cmd: singleCmd
        });
    }
}

/**
 * Factory para crear CommandExecutor
 */
export function createCommandExecutor<TMsg>(
    handlerResolver: HandlerResolver<TMsg>,
    middlewareChain: MiddlewareChain<any, TMsg>,
    getDispatch: () => (msg: TMsg) => void,
    parentMeta?: MessageMeta
): CommandExecutor<TMsg> {
    return new CommandExecutor<TMsg>(
        handlerResolver,
        middlewareChain,
        getDispatch,
        parentMeta
    );
}
