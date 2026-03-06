import { match } from 'ts-pattern';
import { Return, singleton, ret } from '../return';
import { Cmd } from '../tea-utils/cmd';
import { RemoteData, WebData } from '../tea-utils/remote.data';
import { RemoteDataHttp } from '../remote.data.http';
import {
    TEAStoreState,
    TEAStoreMsg,
    TEAStoreMsgType,
    TEAStoreConfig,
    Entity
} from './tea-store.types';

/**
 * Creates a TEAStore update function factory.
 * 
 * This factory function returns an object containing:
 * - `initial`: The initial state for the store
 * - `update`: The update function that handles all messages
 * 
 * @param config - Configuration object with CRUD service functions
 * @returns Object with initial state and update function
 * 
 * @example
 * const { initial, update } = createTEAStoreUpdate<User>({
 *     fetchAll: userService.fetchAll,
 *     fetchOne: userService.fetchOne,
 *     create: userService.create,
 *     update: userService.update,
 *     delete: userService.delete,
 * });
 */
export const createTEAStoreUpdate = <T extends Entity>(
    config: TEAStoreConfig<T>
) => {
    const initial: TEAStoreState<T> = {
        items: config.initialData
            ? RemoteData.success(config.initialData)
            : RemoteData.notAsked(),
        selectedItem: RemoteData.notAsked(),
        operationStatus: RemoteData.notAsked(),
        isCreating: false,
        isEditing: false,
        editingId: null,
    };

    const update = (
        model: TEAStoreState<T>,
        msg: TEAStoreMsg<T>
    ): Return<TEAStoreState<T>, TEAStoreMsg<T>> => {
        return match<TEAStoreMsg<T>, Return<TEAStoreState<T>, TEAStoreMsg<T>>>(msg)
            // Fetch All
            .with({ type: TEAStoreMsgType.FETCH_ALL_REQUESTED }, () =>
                ret(
                    { ...model, items: RemoteData.loading() },
                    RemoteDataHttp.fetch(
                        () => config.fetchAll(),
                        (response: WebData<T[]>) => ({
                            type: TEAStoreMsgType.FETCH_ALL_RESPONSE,
                            response
                        })
                    )
                )
            )
            .with({ type: TEAStoreMsgType.FETCH_ALL_RESPONSE }, ({ response }) =>
                RemoteData.fold(
                    {
                        notAsked: () => singleton(model),
                        loading: () => singleton(model),
                        failure: (error) => {
                            config.onError?.(error);
                            return singleton({
                                ...model,
                                items: RemoteData.failure(error)
                            });
                        },
                        success: (items) => singleton({
                            ...model,
                            items: RemoteData.success(items)
                        })
                    },
                    response
                )
            )

            // Fetch One
            .with({ type: TEAStoreMsgType.FETCH_ONE_REQUESTED }, ({ id }) =>
                ret(
                    { ...model, selectedItem: RemoteData.loading() },
                    RemoteDataHttp.fetch(
                        () => config.fetchOne(id),
                        (response: WebData<T>) => ({
                            type: TEAStoreMsgType.FETCH_ONE_RESPONSE,
                            response
                        })
                    )
                )
            )
            .with({ type: TEAStoreMsgType.FETCH_ONE_RESPONSE }, ({ response }) =>
                RemoteData.fold(
                    {
                        notAsked: () => singleton(model),
                        loading: () => singleton(model),
                        failure: (error) => {
                            config.onError?.(error);
                            return singleton({
                                ...model,
                                selectedItem: RemoteData.failure(error)
                            });
                        },
                        success: (item) => singleton({
                            ...model,
                            selectedItem: RemoteData.success(item)
                        })
                    },
                    response
                )
            )

            // Create
            .with({ type: TEAStoreMsgType.CREATE_REQUESTED }, ({ data }) =>
                ret(
                    { ...model, operationStatus: RemoteData.loading() },
                    RemoteDataHttp.fetch(
                        () => config.create(data),
                        (response: WebData<T>) => ({
                            type: TEAStoreMsgType.CREATE_RESPONSE,
                            response
                        })
                    )
                )
            )
            .with({ type: TEAStoreMsgType.CREATE_RESPONSE }, ({ response }) =>
                RemoteData.fold(
                    {
                        notAsked: () => singleton(model),
                        loading: () => singleton(model),
                        failure: (error) => {
                            config.onError?.(error);
                            return singleton({
                                ...model,
                                operationStatus: RemoteData.failure(error),
                                isCreating: false
                            });
                        },
                        success: (newItem) => {
                            // Add new item to items list if it's loaded
                            const nextItems = RemoteData.map(
                                (items: T[]) => [...items, newItem],
                                model.items
                            );
                            return singleton({
                                ...model,
                                items: nextItems,
                                operationStatus: RemoteData.success(newItem),
                                isCreating: false
                            });
                        }
                    },
                    response
                )
            )

            // Update
            .with({ type: TEAStoreMsgType.UPDATE_REQUESTED }, ({ id, data }) =>
                ret(
                    { ...model, operationStatus: RemoteData.loading() },
                    RemoteDataHttp.fetch(
                        () => config.update(id, data),
                        (response: WebData<T>) => ({
                            type: TEAStoreMsgType.UPDATE_RESPONSE,
                            response
                        })
                    )
                )
            )
            .with({ type: TEAStoreMsgType.UPDATE_RESPONSE }, ({ response }) =>
                RemoteData.fold(
                    {
                        notAsked: () => singleton(model),
                        loading: () => singleton(model),
                        failure: (error) => {
                            config.onError?.(error);
                            return singleton({
                                ...model,
                                operationStatus: RemoteData.failure(error),
                                isEditing: false,
                                editingId: null
                            });
                        },
                        success: (updatedItem) => {
                            // Update item in items list
                            const nextItems = RemoteData.map(
                                (items: T[]) => items.map(item =>
                                    item.id === updatedItem.id ? updatedItem : item
                                ),
                                model.items
                            );
                            // Update selected item if it matches
                            const nextSelected = RemoteData.map(
                                (item: T) => item.id === updatedItem.id ? updatedItem : item,
                                model.selectedItem
                            );
                            return singleton({
                                ...model,
                                items: nextItems,
                                selectedItem: nextSelected,
                                operationStatus: RemoteData.success(updatedItem),
                                isEditing: false,
                                editingId: null
                            });
                        }
                    },
                    response
                )
            )

            // Delete
            .with({ type: TEAStoreMsgType.DELETE_REQUESTED }, ({ id }) =>
                ret(
                    { ...model, operationStatus: RemoteData.loading() },
                    RemoteDataHttp.fetch(
                        () => config.delete(id),
                        (response: WebData<void>) => ({
                            type: TEAStoreMsgType.DELETE_RESPONSE,
                            response
                        })
                    )
                )
            )
            .with({ type: TEAStoreMsgType.DELETE_RESPONSE }, ({ response }) =>
                RemoteData.fold(
                    {
                        notAsked: () => singleton(model),
                        loading: () => singleton(model),
                        failure: (error) => {
                            config.onError?.(error);
                            return singleton({
                                ...model,
                                operationStatus: RemoteData.failure(error)
                            });
                        },
                        success: () => {
                            // Remove item from items list
                            const nextItems = RemoteData.map(
                                (items: T[]) => items.filter(item => item.id !== model.editingId),
                                model.items
                            );
                            // Clear selected item if it was deleted
                            const nextSelected = RemoteData.fold(
                                {
                                    notAsked: () => model.selectedItem,
                                    loading: () => model.selectedItem,
                                    failure: () => model.selectedItem,
                                    success: (item: T) =>
                                        item.id === model.editingId
                                            ? RemoteData.notAsked()
                                            : model.selectedItem
                                },
                                model.selectedItem
                            );
                            return singleton({
                                ...model,
                                items: nextItems,
                                selectedItem: nextSelected,
                                operationStatus: RemoteData.success(undefined as T),
                                editingId: null
                            });
                        }
                    },
                    response
                )
            )

            // Select Item
            .with({ type: TEAStoreMsgType.SELECT_ITEM }, ({ id }) => {
                if (id === null) {
                    return singleton({
                        ...model,
                        selectedItem: RemoteData.notAsked()
                    });
                }

                // Find item in loaded items
                const item = RemoteData.fold(
                    {
                        notAsked: () => null,
                        loading: () => null,
                        failure: () => null,
                        success: (items: T[]) => items.find(i => i.id === id) || null
                    },
                    model.items
                );

                if (item) {
                    return singleton({
                        ...model,
                        selectedItem: RemoteData.success(item)
                    });
                }

                // If not found, fetch it
                return ret(
                    model,
                    Cmd.ofMsg({ type: TEAStoreMsgType.FETCH_ONE_REQUESTED, id })
                );
            })

            // Start Create
            .with({ type: TEAStoreMsgType.START_CREATE }, () =>
                singleton({
                    ...model,
                    isCreating: true,
                    isEditing: false,
                    editingId: null,
                    operationStatus: RemoteData.notAsked()
                })
            )

            // Start Edit
            .with({ type: TEAStoreMsgType.START_EDIT }, ({ id }) =>
                singleton({
                    ...model,
                    isEditing: true,
                    editingId: id,
                    operationStatus: RemoteData.notAsked()
                })
            )

            // Cancel Edit
            .with({ type: TEAStoreMsgType.CANCEL_EDIT }, () =>
                singleton({
                    ...model,
                    isCreating: false,
                    isEditing: false,
                    editingId: null,
                    operationStatus: RemoteData.notAsked()
                })
            )

            // Clear Error
            .with({ type: TEAStoreMsgType.CLEAR_ERROR }, () =>
                singleton({
                    ...model,
                    operationStatus: RemoteData.notAsked()
                })
            )

            // Reset
            .with({ type: TEAStoreMsgType.RESET }, () =>
                singleton(initial)
            )

            .exhaustive();
    };

    return { initial, update };
};
