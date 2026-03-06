import { match } from 'ts-pattern';
import { createElmStore, UpdateResult } from '../engine/engine';
import { Cmd } from '../tea-utils/cmd';
import { ret, singleton } from '../return';
import { RemoteData } from '../tea-utils/remote.data';
import { ModuleLoader } from './module_loader';
import { ModuleManifest } from '../architecture/manifest';
import { logger } from '../../utils/logger';
import { createLoggerMiddleware } from '../middlewares/logger.middleware';
import { effectHandlers } from '../tea-utils/effect_handlers';

// --- Model ---

export interface LoaderModel {
    status: RemoteData<Error, boolean>;
}

// --- Msg ---

export type LoaderMsg =
    | { type: 'LOAD_MODULE' }
    | { type: 'MODULE_LOADED' }
    | { type: 'LOAD_FAILED'; error: Error };

// --- Factory ---

/**
 * Creates a TEA store for loading a specific module dynamically.
 * @param manifest The module manifest to load.
 */
export const createModuleLoaderStore = (manifest: ModuleManifest) => {

    const init = (): UpdateResult<LoaderModel, LoaderMsg> => {
        // Check if already loaded to avoid redundant work
        const isLoaded = ModuleLoader.isModuleLoaded(manifest.name);
        return [
            { status: isLoaded ? RemoteData.success(true) : RemoteData.notAsked() },
            Cmd.none
        ];
    };

    const update = (model: LoaderModel, msg: LoaderMsg): UpdateResult<LoaderModel, LoaderMsg> => {
        return match<LoaderMsg, UpdateResult<LoaderModel, LoaderMsg>>(msg)
            .with({ type: 'LOAD_MODULE' }, () => {
                if (RemoteData.isSuccess(model.status) || RemoteData.isLoading(model.status)) {
                    return singleton(model);
                }

                return ret(
                    { status: RemoteData.loading() },
                    Cmd.task({
                        task: async () => {
                            logger.info(`Starting dynamic load of module: ${manifest.name}...`, 'MODULE_LOADER_STORE');
                            await ModuleLoader.loadModule(manifest);
                            return { type: 'MODULE_LOADED' };
                        },
                        onSuccess: (m: LoaderMsg) => m,
                        onFailure: (error: any) => {
                            logger.error(`Failed to load module: ${manifest.name}`, 'MODULE_LOADER_STORE', error);
                            return { type: 'LOAD_FAILED', error: error instanceof Error ? error : new Error(String(error)) };
                        }
                    })
                );
            })
            .with({ type: 'MODULE_LOADED' }, () => {
                return singleton({ status: RemoteData.success(true) });
            })
            .with({ type: 'LOAD_FAILED' }, ({ error }) => {
                return singleton({ status: RemoteData.failure(error) });
            })
            .exhaustive();
    };

    return createElmStore<LoaderModel, LoaderMsg>(
        init,
        update,
        effectHandlers as any, // Use core effects (TASK handler needed)
        undefined, // No subscriptions
        [createLoggerMiddleware()] // Inject Logger Middleware
    );
};
