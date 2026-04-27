import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { ScreenContainer } from '../screen_container';
import { Flex } from '../flex';
import { Label } from '../label';

export const ScreenContainerBasicExample = () => (
  <ScreenContainer backgroundColor="#F7F9FC">
    <Flex flex={1} justify="center" align="center" gap={16}>
      <Label type="title" value="Screen Basico" />
      <Label type="detail" value="edges=['top','left','right','bottom'] (default)" />
      <Label type="detail" value="backgroundColor='#F7F9FC'" />
    </Flex>
  </ScreenContainer>
);

export const ScreenContainerTopOnlyExample = () => (
  <ScreenContainer edges={['top']} backgroundColor="#F0FAF5">
    <Flex flex={1} justify="center" align="center" gap={16}>
      <Label type="title" value="Solo top edge" />
      <Label type="detail" value="edges={['top']}" />
    </Flex>
  </ScreenContainer>
);

export const ScreenContainerScrollableExample = () => (
  <ScreenContainer scrollable backgroundColor="#FFF8E1">
    <Flex vertical gap={12} padding="l">
      <Label type="title" value="Scrollable Content" />
      <Label type="detail" value="scrollable={true}" />
      {Array.from({ length: 20 }).map((_, i) => (
        <Flex key={i} padding="m" rounded background="#FFFFFF" align="center">
          <Label value={`Item ${i + 1} — contenido largo que demuestra el scroll`} />
        </Flex>
      ))}
    </Flex>
  </ScreenContainer>
);

export const ScreenContainerKeyboardExample = () => (
  <ScreenContainer keyboardAvoiding keyboardVerticalOffset={80} dismissOnTouchOutside>
    <Flex vertical gap={16} padding="l">
      <Label type="title" value="Keyboard Avoiding" />
      <Label type="detail" value="keyboardAvoiding + dismissOnTouchOutside" />
      <View style={styles.inputBlock}>
        <Label type="subheader" value="Campo 1" />
        <TextInput style={styles.input} placeholder="Escribe aqui..." />
      </View>
      <View style={styles.inputBlock}>
        <Label type="subheader" value="Campo 2" />
        <TextInput style={styles.input} placeholder="Otro campo..." />
      </View>
      <View style={styles.inputBlock}>
        <Label type="subheader" value="Campo 3" />
        <TextInput style={styles.input} placeholder="Ultimo campo" />
      </View>
    </Flex>
  </ScreenContainer>
);

export const ScreenContainerCombinedExample = () => (
  <ScreenContainer
    scrollable
    keyboardAvoiding
    dismissOnTouchOutside
    backgroundColor="#F7F9FC"
    edges={['top', 'left', 'right']}
  >
    <Flex vertical gap={16} padding="l">
      <Label type="title" value="Combined Example" />
      <Label type="detail" value="scrollable + keyboardAvoiding + dismissOnTouchOutside" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Flex key={i} padding="m" rounded background="#FFFFFF">
          <Label type="subheader" value={`Seccion ${i + 1}`} />
          <TextInput style={styles.input} placeholder={`Input ${i + 1}`} />
        </Flex>
      ))}
    </Flex>
  </ScreenContainer>
);

export const ScreenContainerCustomContentStyleExample = () => (
  <ScreenContainer
    backgroundColor="#F7F9FC"
    contentStyle={{ padding: 24 }}
  >
    <Flex flex={1} vertical gap={12} justify="center" align="center">
      <Label type="title" value="Custom Content Style" />
      <Label type="detail" value="contentStyle={{ padding: 24 }}" />
    </Flex>
  </ScreenContainer>
);

const styles = StyleSheet.create({
  inputBlock: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4E9F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
});
