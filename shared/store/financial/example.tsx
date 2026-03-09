import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { FinancialModule } from './store';
import { match } from 'ts-pattern';

/**
 * EJEMPLO DE USO DE LA NUEVA ARQUITECTURA TEA MODULE
 * 
 * Este componente demuestra cómo consumir el FinancialStore de manera segura
 * y eficiente utilizando el nuevo patrón de Context Provider.
 */

// 1. Componente Consumidor (Hijo)
const FinancialDashboard: React.FC<{ nodeId: number }> = ({ nodeId }) => {
    // Usamos el hook generado por el módulo. 
    // Si este componente se renderiza fuera de FinancialModule.Provider, 
    // lanzará un error descriptivo de arquitectura.
    const summary = FinancialModule.useStore(state => state.model.summaries[nodeId]);
    const dispatch = FinancialModule.useDispatch();

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Resumen Financiero</Text>
            
            {/* Uso de RemoteData con ts-pattern para manejar estados de carga */}
            {match(summary)
                .with({ type: 'Loading' }, () => <ActivityIndicator size="large" />)
                .with({ type: 'Success' }, ({ data }) => (
                    <View>
                        <Text>Total Recaudado: {data.total_collected}</Text>
                        <Text>Premios Pagados: {data.total_paid}</Text>
                        <Text>Resultado Neto: {data.total_net}</Text>
                    </View>
                ))
                .with({ type: 'Failure' }, ({ error }) => (
                    <Text style={{ color: 'red' }}>Error: {error}</Text>
                ))
                .otherwise(() => (
                    <Text>No hay datos disponibles para el nodo {nodeId}</Text>
                ))}

            <Text 
                onPress={() => dispatch({ type: 'FETCH_DRAW_SUMMARY_REQUESTED', drawId: 1 })}
                style={{ marginTop: 20, color: 'blue' }}
            >
                Refrescar Datos
            </Text>
        </View>
    );
};

/**
 * EJEMPLO 2: SELECTORES ATÓMICOS (ALTO RENDIMIENTO)
 * Este componente solo se re-renderiza cuando cambia específicamente el campo 'netResult'.
 */
const NetResultBadge: React.FC<{ nodeId: number }> = ({ nodeId }) => {
    // Escuchamos un valor primitivo específico. 
    // Si otros campos del modelo cambian (ej: totalCollected), este componente NO se re-renderiza.
    const netResult = FinancialModule.useStore(state => 
        state.model.summaries[nodeId]?.type === 'Success' 
            ? state.model.summaries[nodeId].data.total_net 
            : 0
    );

    return (
        <View style={{ backgroundColor: netResult >= 0 ? '#E6FFFA' : '#FFF5F5', padding: 10 }}>
            <Text style={{ color: netResult >= 0 ? '#2C7A7B' : '#C53030' }}>
                Balance: {netResult.toLocaleString()}
            </Text>
        </View>
    );
};

/**
 * EJEMPLO 3: SELECTOR COMPUESTO (MÚLTIPLES CAMPOS)
 * Útil cuando necesitas varios valores pero quieres evitar múltiples llamadas a useStore.
 */
const FinancialHeader: React.FC<{ nodeId: number }> = ({ nodeId }) => {
    // Seleccionamos un objeto con múltiples campos.
    const { total, net } = FinancialModule.useStore(state => {
        const data = state.model.summaries[nodeId];
        return {
            total: data?.type === 'Success' ? data.data.total_collected : 0,
            net: data?.type === 'Success' ? data.data.total_net : 0
        };
    });

    return (
        <View style={{ borderBottomWidth: 1, padding: 15 }}>
            <Text>Ventas: {total.toLocaleString()} | Neto: {net.toLocaleString()}</Text>
        </View>
    );
};

/**
 * EJEMPLO 4: REACCIÓN A CAMBIOS (SIDE EFFECTS)
 * Cómo disparar una acción en React cuando el modelo de Elm cambia.
 */
const AutoRefreshNotification: React.FC<{ nodeId: number }> = ({ nodeId }) => {
    // Escuchamos el estado de carga
    const status = FinancialModule.useStore(state => state.model.summaries[nodeId]?.type);
    
    React.useEffect(() => {
        if (status === 'Success') {
            console.log('¡Datos actualizados exitosamente en el modelo!');
        }
    }, [status]); // Solo se ejecuta cuando el discriminante del RemoteData cambia

    return null;
};

// 2. Punto de Montaje (Padre o Layout)
export const ExampleUsage = () => {
    return (
        /* 
           IMPORTANTE: FinancialModule.Provider encapsula el ciclo de vida del Store.
           El Store (y sus suscripciones de sincronización) solo existen mientras 
           este Provider esté montado.
        */
        <FinancialModule.Provider>
            <View style={{ flex: 1 }}>
                <FinancialHeader nodeId={123} />
                
                <Text style={{ padding: 20, fontSize: 20 }}>Módulo de Finanzas</Text>
                
                <NetResultBadge nodeId={123} />
                <FinancialDashboard nodeId={123} />
                
                <AutoRefreshNotification nodeId={123} />
            </View>
        </FinancialModule.Provider>
    );
};

/**
 * REGLAS DE ORO DE ESTA ARQUITECTURA:
 * 
 * 1. No intentes importar useFinancialStore directamente como un singleton global.
 * 2. Siempre envuelve la sección de la app que necesite finanzas con FinancialModule.Provider.
 * 3. Al desmontar el Provider (ej: Logout), todas las suscripciones de red se limpian automáticamente.
 * 4. El store se inicializa de forma "perezosa" (Lazy), optimizando el arranque de la app.
 */
