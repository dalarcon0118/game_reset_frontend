import React from 'react';
import { View, Text, ActivityIndicator, Button, StyleSheet } from 'react-native';
import { match } from 'ts-pattern';
import { WebData } from './remote.data';

// --- Types ---
interface Vehicle { id: string; name: string }

interface Props {
    vehicles: WebData<Vehicle[]>;
    onLoad: () => void;
}

/**
 * Componente presentacional que renderiza según el estado de RemoteData usando ts-pattern.
 */
export const VehiclesList: React.FC<Props> = ({ vehicles, onLoad }) => {
    return (
        <View style={styles.container}>
            {/* 
              Usamos `match` de ts-pattern para manejar los estados de forma exhaustiva y limpia.
            */}
            {match(vehicles)
                .with({ type: 'NotAsked' }, () => (
                    <View style={styles.center}>
                        <Text style={styles.text}>No hay datos cargados.</Text>
                        <Button title="Cargar Vehículos" onPress={onLoad} />
                    </View>
                ))
                .with({ type: 'Loading' }, () => (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text style={styles.text}>Cargando...</Text>
                    </View>
                ))
                .with({ type: 'Failure' }, (res) => (
                    <View style={styles.center}>
                        <Text style={styles.error}>Error: {String(res.error)}</Text>
                        <Button title="Reintentar" onPress={onLoad} />
                    </View>
                ))
                .with({ type: 'Success' }, (res) => (
                    <View>
                        <Text style={styles.header}>Vehículos ({res.data.length})</Text>
                        {res.data.map(v => (
                            <Text key={v.id} style={styles.item}>• {v.name}</Text>
                        ))}
                    </View>
                ))
                .exhaustive()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    center: { alignItems: 'center', gap: 10 },
    text: { fontSize: 16 },
    error: { fontSize: 16, color: 'red' },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    item: { fontSize: 16, marginVertical: 2 }
});
