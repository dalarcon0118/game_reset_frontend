import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Layout, Text, Button, Input } from '@ui-kitten/components';
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

                <Button onPress={handleSubmit}>  Submit           </Button>

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
  
                  <Button onPress={handleSubmit}>  Submit           </Button>
  
      </BottomDrawer>
    );
    };

  return (
    <SafeAreaView>
      <Layout style={styles.container} level='1'>
      <Layout style={styles.header} level='1'>
        <Text category='s1' style={styles.headerText}>
          Acciones Rápidas
        </Text>
      </Layout>
      
      <Layout style={styles.buttonsContainer} level='1'>
        <Button
          style={styles.primaryButton}
          status='primary'
          size='large'
          onPress={handleEditBet}
        >
          Editar Jugada
        </Button>
        <Button
          style={styles.secondaryButton}
          appearance='outline'
          status='basic'
          size='large'
          onPress={showModalDelete}
        >
          Eliminar jugada
        </Button>
      </Layout>

     
    </Layout>
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