import React from 'react';
import { ScrollView } from 'react-native';
import { Flex } from '../flex';
import { Label } from '../label';
import { NumberDisplay } from '../number_display';

export const NumberDisplayBetArrayExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="NumberDisplay — bet con array" />
    <Label type="detail" value="numbers={[5, 23, 47]}" />
    <NumberDisplay numbers={[5, 23, 47]} annotationType="bet" />

    <Label type="detail" value="numbers={[1, 2, 3, 4, 5]}" />
    <NumberDisplay numbers={[1, 2, 3, 4, 5]} annotationType="bet" />
  </Flex>
);

export const NumberDisplayBetStringExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="NumberDisplay — bet con string" />
    <Label type="detail" value='numbers="52347"' />
    <NumberDisplay numbers="52347" annotationType="bet" />

    <Label type="detail" value='numbers="123"' />
    <NumberDisplay numbers="123" annotationType="bet" />
  </Flex>
);

export const NumberDisplayGameTypeExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="NumberDisplay — gameTypeCode" />
    <Label type="detail" value='gameTypeCode="fijo" (padStart 2)' />
    <NumberDisplay numbers={[3, 7]} gameTypeCode="fijo" annotationType="bet" />

    <Label type="detail" value='gameTypeCode="centena" (padStart 3)' />
    <NumberDisplay numbers={[5, 12]} gameTypeCode="centena" annotationType="bet" />

    <Label type="detail" value='gameTypeCode="parlet" (padStart 2)' />
    <NumberDisplay numbers={[1, 45, 89]} gameTypeCode="parlet" annotationType="bet" />
  </Flex>
);

export const NumberDisplayAmountExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="NumberDisplay — annotationType='amount'" />
    <Label type="detail" value="numbers={[10, 20, 50]}" />
    <NumberDisplay numbers={[10, 20, 50]} annotationType="amount" />

    <Label type="detail" value='numbers="105020"' />
    <NumberDisplay numbers="105020" annotationType="amount" />
  </Flex>
);

export const NumberDisplayEmptyExample = () => (
  <Flex vertical gap={8} padding="m" rounded>
    <Label type="header" value="NumberDisplay — empty state" />
    <Label type="detail" value="numbers={[]}" />
    <NumberDisplay numbers={[]} annotationType="bet" />
  </Flex>
);

export const NumberDisplayAllExamples = () => (
  <ScrollView contentContainerStyle={{ padding: 16 }}>
    <Flex vertical gap={16}>
      <Label type="title" value="NumberDisplay Examples" />
      <NumberDisplayBetArrayExample />
      <NumberDisplayBetStringExample />
      <NumberDisplayGameTypeExample />
      <NumberDisplayAmountExample />
      <NumberDisplayEmptyExample />
    </Flex>
  </ScrollView>
);
