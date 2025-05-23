import { DrawerModal } from "@/components/ui/DrawerModal";
import { Button, Input, Text } from "@ui-kitten/components";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import LayoutConstants from '@/constants/Layout';

 export default function EditPlay({isVisible,onClose}: any) {
    const [betId, setBetId] = useState('');
  
    const handleAccept = () => {
      if (betId) {
        
       
      }
    };
  return (
    <DrawerModal
        visible={isVisible}
        onClose={onClose}
        title="Jugada a editar"
      >
        <Text category='s1' >
          Inserte el número de la jugada a editar
        </Text>
        
        <Input
          placeholder='Identificador de jugada'
          value={betId}
          onChangeText={setBetId}
        />
        
        <Button onPress={handleAccept} style={styles.acceptButton}>
          Aceptar
        </Button>
      </DrawerModal>
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