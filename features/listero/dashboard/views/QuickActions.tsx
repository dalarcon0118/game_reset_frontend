import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Input } from '@ui-kitten/components';
import { Label, Flex, ButtonKit } from '../../../../shared/components';
import LayoutConstants from '@/constants/Layout';
import BottomDrawer from '@/components/ui/BottomDrawer';

interface QuickActionsProps {
  
}

export default function QuickActions({
}: QuickActionsProps) {
 
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isDrawerDelete, setIsDrawerDelete] = useState(false);

  const [value, setValue] = useState('');

  const showModal = () => setIsDrawerVisible(true);
  const hideModal = () => setIsDrawerVisible(false);
  const showModalDelete = () => setIsDrawerVisible(true);
  const hideModalDelete = () => setIsDrawerVisible(false);
  const handleEditBet = () => {
    showModal();
  };
  const handleDeleteBet = () => {
    showModal();
  };
  const handleSubmit = () => {
    console.log('Submitted:', value);
    setValue('');
    hideModal();
  };

 const editPlay = () => {
 return(
     <BottomDrawer isVisible ={isDrawerVisible} onClose={hideModal} title='Jugada a Editar'>
       <Input
                 placeholder="Type something here..."
                 value={value}
                 onChangeText={setValue}
                 style={styles.input}
                 size="large"
                 autoFocus
               />

               <ButtonKit onPress={handleSubmit} label="Submit" />

   </BottomDrawer>
 );
 };
 const deletePlay = () => {
   return(
       <BottomDrawer isVisible ={isDrawerVisible} onClose={hideModal} title='Jugada a Eliminar'>
         <Input
                   placeholder="Type something here..."
                   value={value}
                   onChangeText={setValue}
                   style={styles.input}
                   size="large"
                   autoFocus
                 />

                 <ButtonKit onPress={handleSubmit} label="Submit" />

     </BottomDrawer>
   );
   };

  return (
    <SafeAreaView>
      <Flex style={styles.container}>
      <Flex style={styles.header}>
        <Label type='subheader' style={styles.headerText}>
          Acciones Rápidas
        </Label>
      </Flex>

      <Flex style={styles.buttonsContainer}>
        <ButtonKit
          style={styles.primaryButton}
          status='primary'
          size='large'
          onPress={handleEditBet}
          label="Editar Jugada"
        />
        <ButtonKit
          style={styles.secondaryButton}
          appearance='outline'
          status='basic'
          size='large'
          onPress={showModalDelete}
          label="Eliminar jugada"
        />
      </Flex>


    </Flex>
    {editPlay()}
    </SafeAreaView>

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