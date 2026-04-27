import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Flex } from '../flex';
import { Label, LabelType } from '../label';

const TypeRow: React.FC<{ type: LabelType; description: string }> = ({ type, description }) => (
  <Flex vertical gap={2} padding="s" style={styles.row}>
    <Label type={type} value={`type='${type}'`} />
    <Label type="detail" value={description} />
  </Flex>
);

export const LabelAllTypesExample = () => (
  <Flex vertical gap={4} padding="m" rounded>
    <TypeRow type="title" description="Títulos principales de pantalla (24px, bold)" />
    <TypeRow type="subtitle" description="Subtítulos de sección (20px, semibold)" />
    <TypeRow type="header" description="Encabezados de card/bloque (16px, bold)" />
    <TypeRow type="subheader" description="Sub-encabezados (14px, semibold, texto claro)" />
    <TypeRow type="date" description="Fechas y timestamps (13px, semibold)" />
    <TypeRow type="number" description="Números destacados / cantidades (22px, bold)" />
    <TypeRow type="detail" description="Texto secundario / detalles (12px, texto claro)" />
    <TypeRow type="error" description="Mensajes de error (14px, color danger)" />
    <TypeRow type="default" description="Texto por defecto (14px, texto oscuro)" />
  </Flex>
);

export const LabelValueExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="Label — value prop" />
    <Label value="Label con value string" />
    <Label value={42} />
    <Label value={3.1416} />
  </Flex>
);

export const LabelChildrenExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="Label — children prop" />
    <Label>Label con children text</Label>
    <Label type="error">
      Label con <Label type="title" value="nested" /> children
    </Label>
  </Flex>
);

export const LabelCustomStyleExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="Label — custom style" />
    <Label style={styles.customLabel} value="Label con estilo custom" />
    <Label type="title" style={{ color: '#FF3D71' }} value="Title modificado a rojo" />
    <Label type="number" style={{ fontSize: 32 }} value={9999} />
  </Flex>
);

export const LabelSafeContentExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="Label — safe content handling" />
    <Label value={{ foo: 'bar' } as any} />
    <Label value={[1, 2, 3] as any} />
    <Label value={[null, 'hello', undefined, 'world'] as any} />
  </Flex>
);

export const LabelAllExamples = () => (
  <ScrollView contentContainerStyle={{ padding: 16 }}>
    <Flex vertical gap={16}>
      <Label type="title" value="Label Component Examples" />

      <Flex vertical gap={4}>
        <Label type="header" value="Todos los tipos" />
        <LabelAllTypesExample />
      </Flex>

      <Flex vertical gap={4}>
        <Label type="header" value="value prop" />
        <LabelValueExample />
      </Flex>

      <Flex vertical gap={4}>
        <Label type="header" value="children prop" />
        <LabelChildrenExample />
      </Flex>

      <Flex vertical gap={4}>
        <Label type="header" value="custom style" />
        <LabelCustomStyleExample />
      </Flex>

      <Flex vertical gap={4}>
        <Label type="header" value="safe content" />
        <LabelSafeContentExample />
      </Flex>
    </Flex>
  </ScrollView>
);

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
  },
  customLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00C48C',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
