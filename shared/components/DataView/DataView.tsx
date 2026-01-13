import React, { useEffect, useReducer } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Button } from 'react-native';
import { RemoteData } from '../../core/remote.data';
import { Model, Msg, init } from './DataView.types';
import { update } from './DataView.update';

interface DataViewProps<T, E = any> {
  // Opciones para uso como componente autónomo
  fetchFn?: () => Promise<T>;
  autoFetch?: boolean;

  // Opciones para uso como "View" de un Store externo (Service mode)
  model?: Model<T, E>;
  dispatch?: (msg: Msg<T, E>) => void;

  // Renderers comunes
  renderSuccess: (data: T) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderFailure?: (error: E) => React.ReactNode;
  renderNotAsked?: () => React.ReactNode;
}

export function DataView<T, E = any>({
  fetchFn,
  renderSuccess,
  renderLoading,
  renderFailure,
  renderNotAsked,
  autoFetch = true,
  model: externalModel,
  dispatch: externalDispatch,
}: DataViewProps<T, E>) {
  // Si se proveen model y dispatch externos, se usa el modo "Service"
  // Si no, se usa el motor interno (modo Autónomo)
  const isServiceMode = !!externalModel && !!externalDispatch;

  const [internalState, internalDispatch] = useReducer(
    (model: Model<T, E>, msg: Msg<T, E>): Model<T, E> => {
      if (!fetchFn) return model;
      const result = update(msg, model, fetchFn);
      const newModel = result.model;
      const cmd = result.cmd;
      
      // Ejecución manual de comandos (en un store global esto lo hace el engine.ts)
      const commands = Array.isArray(cmd) ? cmd : cmd ? [cmd] : [];

      commands.forEach(command => {
        if (command.type === 'TASK') {
          const { task, onSuccess, onFailure } = command.payload;
          task()
            .then((data: T) => internalDispatch(onSuccess(data)))
            .catch((err: E) => internalDispatch(onFailure(err)));
        }
      });
      
      return newModel;
    },
    init<T, E>()
  );

  const state = isServiceMode ? externalModel : internalState;
  const dispatch = isServiceMode ? externalDispatch : internalDispatch;

  useEffect(() => {
    if (autoFetch && !isServiceMode) {
      dispatch({ type: 'FETCH_START' });
    }
  }, [autoFetch, isServiceMode]);

  return (
    <View style={styles.container}>
      {RemoteData.fold<E, T, React.ReactNode>(
        {
          notAsked: () =>
            renderNotAsked ? (
              renderNotAsked()
            ) : (
              <Button title="Cargar datos" onPress={() => dispatch({ type: 'FETCH_START' })} />
            ),
          loading: () =>
            renderLoading ? (
              renderLoading()
            ) : (
              <ActivityIndicator size="large" color="#0000ff" />
            ),
          failure: (error) =>
            renderFailure ? (
              renderFailure(error)
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {String(error)}</Text>
                <Button title="Reintentar" onPress={() => dispatch({ type: 'FETCH_START' })} />
              </View>
            ),
          success: (data) => renderSuccess(data),
        },
        state.remoteData
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});
