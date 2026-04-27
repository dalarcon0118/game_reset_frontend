import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Flex } from '../flex';
import { Label } from '../label';
import { ButtonKit } from '../button';
import { withDataView } from '../with_data_view';

interface ItemListProps {
  items: string[];
}

const ItemListComponent: React.FC<ItemListProps> = ({ items }) => (
  <Flex vertical gap={8}>
    {items.map((item, i) => (
      <Flex key={i} padding="m" rounded background="#FFFFFF" align="center">
        <Label value={item} />
      </Flex>
    ))}
  </Flex>
);

const ItemListWithData = withDataView<ItemListProps>(ItemListComponent);

export const WithDataViewLoadingExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="withDataView - Loading" />
    <Label type="detail" value="loading={true} isEmpty={true}" />
    <ItemListWithData
      loading={true}
      isEmpty={true}
      error={null}
      onRetry={() => {}}
      items={[]}
    />
  </Flex>
);

export const WithDataViewErrorExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="withDataView - Error" />
    <Label type="detail" value="error={new Error('Network failed')}" />
    <ItemListWithData
      loading={false}
      isEmpty={true}
      error={new Error('Network failed')}
      onRetry={() => console.log('Retry clicked')}
      errorMessage="Error de conexion"
      items={[]}
    />
  </Flex>
);

export const WithDataViewEmptyExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="withDataView - Empty" />
    <Label type="detail" value="isEmpty={true} loading={false}" />
    <ItemListWithData
      loading={false}
      isEmpty={true}
      error={null}
      onRetry={() => {}}
      emptyMessage="No se encontraron items"
      items={[]}
    />
  </Flex>
);

export const WithDataViewSuccessExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="withDataView - Success" />
    <Label type="detail" value="isEmpty={false} loading={false}" />
    <ItemListWithData
      loading={false}
      isEmpty={false}
      error={null}
      onRetry={() => {}}
      items={['Item Alpha', 'Item Beta', 'Item Gamma']}
    />
  </Flex>
);

export const WithDataViewCustomMessagesExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="withDataView - Custom Messages" />
    <Label type="detail" value="emptyMessage y errorMessage personalizados" />
    <ItemListWithData
      loading={false}
      isEmpty={true}
      error={null}
      onRetry={() => {}}
      emptyMessage="No hay resultados para tu busqueda"
      items={[]}
    />
  </Flex>
);

type DataViewState = 'loading' | 'error' | 'empty' | 'success';

export const WithDataViewInteractiveExample = () => {
  const [state, setState] = useState<DataViewState>('loading');

  const getData = (): { loading: boolean; isEmpty: boolean; error: Error | null } => {
    switch (state) {
      case 'loading': return { loading: true, isEmpty: true, error: null };
      case 'error': return { loading: false, isEmpty: true, error: new Error('Server error') };
      case 'empty': return { loading: false, isEmpty: true, error: null };
      case 'success': return { loading: false, isEmpty: false, error: null };
    }
  };

  const data = getData();

  return (
    <Flex vertical gap={12} padding="m" rounded>
      <Label type="header" value="withDataView - Interactive" />
      <Flex gap={8} wrap>
        <ButtonKit label="Loading" size="small" onPress={() => setState('loading')} />
        <ButtonKit label="Error" size="small" onPress={() => setState('error')} />
        <ButtonKit label="Empty" size="small" onPress={() => setState('empty')} />
        <ButtonKit label="Success" size="small" onPress={() => setState('success')} />
      </Flex>
      <Label type="detail" value={`Estado: ${state}`} />
      <ItemListWithData
        {...data}
        onRetry={() => setState('loading')}
        emptyMessage="No hay datos disponibles"
        errorMessage="Ocurrio un error inesperado"
        items={state === 'success' ? ['Item 1', 'Item 2', 'Item 3'] : []}
      />
    </Flex>
  );
};

export const WithDataViewAllExamples = () => (
  <ScrollView contentContainerStyle={{ padding: 16 }}>
    <Flex vertical gap={16}>
      <Label type="title" value="withDataView Examples" />
      <WithDataViewLoadingExample />
      <WithDataViewErrorExample />
      <WithDataViewEmptyExample />
      <WithDataViewSuccessExample />
      <WithDataViewCustomMessagesExample />
      <WithDataViewInteractiveExample />
    </Flex>
  </ScrollView>
);
