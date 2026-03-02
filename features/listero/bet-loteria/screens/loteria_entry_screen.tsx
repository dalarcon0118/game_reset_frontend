import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout, Button } from '@ui-kitten/components';
import { LoteriaColumn } from '../components/loteria/loteria_column';
import { useLoteria } from '../use_loteria';
import { SumRowComponent } from '@/shared/components/bets/sum_row_component';
import { useTheme } from '@/shared/hooks/use_theme';

interface LoteriaEntryScreenProps {
    drawId?: string;
    title?: string;
}

/**
 * Pantalla principal para la entrada de jugadas de Lotería.
 * Sigue el patrón TEA (Model-View-Update) delegando la lógica al hook useLoteria.
 */
const LoteriaEntryScreen: React.FC<LoteriaEntryScreenProps> = ({ drawId }) => {
    const { colors } = useTheme();
    const { loteriaTotal, hasBets, isSaving, handleSave } = useLoteria(drawId);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* El anotador siempre recibe isEditing en true para permitir la entrada de datos */}
                <LoteriaColumn isEditing={true} />
            </View>

            {hasBets && (
                <LoteriaFooter
                    total={loteriaTotal}
                    isSaving={isSaving}
                    onSave={handleSave}
                />
            )}
        </View>
    );
};

/**
 * Componente interno para el pie de página que muestra el total y el botón de guardado.
 */
const LoteriaFooter: React.FC<{
    total: number;
    isSaving: boolean;
    onSave: () => void;
}> = ({ total, isSaving, onSave }) => {
    const { colors } = useTheme();

    return (
        <Layout style={[styles.footer, { borderTopColor: colors.border }]} level='1'>
            <View style={styles.grandTotalContainer}>
                <SumRowComponent
                    label="Total Lista"
                    total={total}
                />
            </View>
            <View style={styles.saveButtonContainer}>
                <Button
                    status='primary'
                    onPress={onSave}
                    size="medium"
                    disabled={isSaving}
                    style={styles.footerButton}
                >
                    {isSaving ? 'Guardando...' : 'Salvar'}
                </Button>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        paddingTop: 16,
    },
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
    },
    grandTotalContainer: {
        marginBottom: 4,
        borderTopWidth: 2,
        borderTopColor: '#E8E8E8',
        paddingTop: 4,
    },
    saveButtonContainer: {
        marginTop: 12,
        paddingHorizontal: 8,
    },
    footerButton: { width: '100%' },
});

export default LoteriaEntryScreen;
