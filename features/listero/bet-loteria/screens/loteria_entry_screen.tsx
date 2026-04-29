import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout, Button } from '@ui-kitten/components';
import { LoteriaColumn } from '../components/loteria/loteria_column';
import { useLoteria } from '../use_loteria';
import { SumRowComponent } from '@/shared/components/bets/sum_row_component';
import { useTheme } from '@/shared/hooks/use_theme';
import { LoteriaStoreProvider } from '../core/store';

interface LoteriaEntryScreenProps {
    drawId?: string;
    title?: string;
}

const LoteriaEntryContent: React.FC<LoteriaEntryScreenProps> = ({ drawId }) => {
  const { colors } = useTheme();
  const { loteriaTotal, hasBets, isSaving, isCatalogReady, isCatalogLoading, catalogError, handleSave } = useLoteria(drawId);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <LoteriaColumn isEditing={true} />
            </View>

            {hasBets && (
    <LoteriaFooter
      total={loteriaTotal}
      isSaving={isSaving}
      isCatalogReady={isCatalogReady}
      isCatalogLoading={isCatalogLoading}
      catalogError={catalogError}
      onSave={handleSave}
    />
            )}
        </View>
    );
};

/**
 * Pantalla principal para la entrada de jugadas de Lotería.
 * Sigue el patrón TEA (Model-View-Update) delegando la lógica al hook useLoteria.
 */
const LoteriaEntryScreen: React.FC<LoteriaEntryScreenProps> = (props) => {
    return (
        <LoteriaStoreProvider initialParams={{ drawId: props.drawId }}>
            <LoteriaEntryContent {...props} />
        </LoteriaStoreProvider>
    );
};

/**
 * Componente interno para el pie de página que muestra el total y el botón de guardado.
 */
const LoteriaFooter: React.FC<{
  total: number;
  isSaving: boolean;
  isCatalogReady: boolean;
  isCatalogLoading?: boolean;
  catalogError?: string | null;
  onSave: () => void;
}> = ({ total, isSaving, isCatalogReady, isCatalogLoading, catalogError, onSave }) => {
  const { colors } = useTheme();

  const saveDisabled = isSaving || !isCatalogReady;

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
          disabled={saveDisabled}
          style={styles.footerButton}
        >
          {isSaving ? 'Guardando...' : !isCatalogReady ? 'Cargando catálogo...' : 'Salvar'}
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
