import { drawer_modal } from "@/components/ui/drawer_modal";
import { Input } from "@ui-kitten/components";
import { Label, ButtonKit } from '../../../../shared/components';
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import LayoutConstants from '@/constants/layout';

 export default function EditPlay({isVisible,onClose}: any) {
    const [betId, setBetId] = useState('');
  
    const handleAccept = () => {
      if (betId) {
        
       
      }
    };
  return (
    <drawer_modal
        visible={isVisible}
        onClose={onClose}
        title="Jugada a editar"
      >
        <Label type='subheader' >
          Inserte el número de la jugada a editar
        </Label>

        <Input
          placeholder='Identificador de jugada'
          value={betId}
          onChangeText={setBetId}
        />

        <ButtonKit onPress={handleAccept} style={styles.acceptButton} label="Aceptar">
      </ButtonKit>
      </drawer_modal>
  );
 }

 const styles = StyleSheet.create({
    container: {
      marginBottom: LayoutConstants.spacing.xl,
    },
    header: {
      marginBottom: LayoutConstants.spacing.md,
      paddingHorizontal: LayoutConstants.spacing.md,
    },
    headerText: {
      fontWeight: 'bold',
    },
    buttonsContainer: {
      paddingHorizontal: LayoutConstants.spacing.md,
    },
    primaryButton: {
      marginBottom: LayoutConstants.spacing.md,
    },
    secondaryButton: {},
    label: {
      marginBottom: LayoutConstants.spacing.sm,
    },
    input: {
      marginBottom: LayoutConstants.spacing.md,
    },
    acceptButton: {
      marginTop: LayoutConstants.spacing.sm,
    },
  });
