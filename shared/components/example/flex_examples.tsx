import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Flex, SpacingProp } from '../flex';
import { Label } from '../label';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Flex vertical margin="xl" gap={8}>
    <Label type="header" value={title} />
    <View style={styles.box}>{children}</View>
  </Flex>
);

const Box: React.FC<{ color?: string; label?: string; width?: number | string; height?: number | string }> = ({
  color = '#00C48C',
  label,
  width = 60,
  height = 40,
}) => (
  <View style={[styles.child, { backgroundColor: color, width, height }]}>
    {label && <Text style={styles.childText}>{label}</Text>}
  </View>
);

export const FlexBasicExample = () => (
  <Section title="Flex — Horizontal (default)">
    <Flex gap={12} align="center">
      <Box label="1" />
      <Box label="2" color="#FFCF5C" />
      <Box label="3" color="#FF3D71" />
    </Flex>
  </Section>
);

export const FlexVerticalExample = () => (
  <Section title="Flex — Vertical">
    <Flex vertical gap={8} align="start">
      <Box label="A" width="100%" />
      <Box label="B" width="80%" color="#FFCF5C" />
      <Box label="C" width="60%" color="#FF3D71" />
    </Flex>
  </Section>
);

export const FlexJustifyExample = () => (
  <Section title="Flex — Justify (between / center / evenly)">
    <Flex vertical gap={12}>
      <Label type="detail" value="justify='between'" />
      <Flex justify="between" align="center">
        <Box label="L" />
        <Box label="M" color="#FFCF5C" />
        <Box label="R" color="#FF3D71" />
      </Flex>

      <Label type="detail" value="justify='center'" />
      <Flex justify="center" align="center" gap={12}>
        <Box label="1" />
        <Box label="2" color="#FFCF5C" />
      </Flex>

      <Label type="detail" value="justify='evenly'" />
      <Flex justify="evenly" align="center">
        <Box label="1" />
        <Box label="2" color="#FFCF5C" />
        <Box label="3" color="#FF3D71" />
      </Flex>
    </Flex>
  </Section>
);

export const FlexAlignExample = () => (
  <Section title="Flex — Align (start / center / stretch)">
    <Flex vertical gap={12}>
      <Label type="detail" value="align='start'" />
      <Flex align="start" gap={12}>
        <Box height={30} label="S" />
        <Box height={60} color="#FFCF5C" label="M" />
        <Box height={45} color="#FF3D71" label="S" />
      </Flex>

      <Label type="detail" value="align='center'" />
      <Flex align="center" gap={12}>
        <Box height={30} label="S" />
        <Box height={60} color="#FFCF5C" label="M" />
        <Box height={45} color="#FF3D71" label="S" />
      </Flex>

      <Label type="detail" value="align='stretch'" />
      <Flex align="stretch" gap={12}>
        <Box label="1" />
        <Box color="#FFCF5C" label="2" />
        <Box color="#FF3D71" label="3" />
      </Flex>
    </Flex>
  </Section>
);

export const FlexWrapExample = () => (
  <Section title="Flex — Wrap">
    <Flex wrap gap={8}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Box key={i} label={`${i + 1}`} width={70} color={['#00C48C', '#FFCF5C', '#FF3D71', '#00E096', '#FFAA00'][i % 5]} />
      ))}
    </Flex>
  </Section>
);

export const FlexSpacingExample = () => (
  <Section title="Flex — Spacing (margin / padding)">
    <Flex vertical gap={12}>
      <Label type="detail" value="padding='l'" />
      <Flex padding="l" background="#F0FAF5" rounded align="center" gap={8}>
        <Box label="1" />
        <Box label="2" color="#FFCF5C" />
      </Flex>

      <Label type="detail" value="padding config: [{ type: 'horizontal', value: 'xl' }, { type: 'vertical', value: 'm' }]" />
      <Flex
        padding={[{ type: 'horizontal', value: 'xl' }, { type: 'vertical', value: 'm' }]}
        background="#FFF8E1"
        rounded
        align="center"
        gap={8}
      >
        <Box label="1" />
        <Box label="2" color="#FFCF5C" />
      </Flex>

      <Label type="detail" value="margin='m'" />
      <Flex margin="m" background="#FCE4EC" rounded align="center" gap={8}>
        <Box label="1" />
        <Box label="2" color="#FFCF5C" />
      </Flex>
    </Flex>
  </Section>
);

export const FlexRoundedExample = () => (
  <Section title="Flex — Rounded & Border">
    <Flex vertical gap={12} align="start">
      <Flex rounded padding="m" background="#F0FAF5" align="center" gap={8}>
        <Label value="rounded (default border)" type="detail" />
      </Flex>

      <Flex
        rounded={{ radius: 20, width: 2, color: '#00C48C' }}
        padding="m"
        background="#F0FAF5"
        align="center"
        gap={8}
      >
        <Label value="rounded custom" type="detail" />
      </Flex>

      <Flex rounded padding="l" background="#FFF0F0" align="center" gap={8}>
        <Label value="rounded with bg" type="detail" />
      </Flex>
    </Flex>
  </Section>
);

export const FlexSizeExample = () => (
  <Section title="Flex — Width & Height">
    <Flex vertical gap={12}>
      <Flex width="100%" height={80} background="#F0FAF5" rounded align="center" justify="center">
        <Label type="detail" value="width='100%' height={80}" />
      </Flex>

      <Flex width={{ value: '80%', max: 400 }} height={60} background="#FFF8E1" rounded align="center" justify="center">
        <Label type="detail" value="width={value:'80%', max:400}" />
      </Flex>

      <Flex width={200} height={50} background="#FCE4EC" rounded align="center" justify="center">
        <Label type="detail" value="width={200}" />
      </Flex>
    </Flex>
  </Section>
);

export const FlexScrollExample = () => (
  <Section title="Flex — Scroll">
    <Flex scroll height={120} gap={8} padding="s">
      {Array.from({ length: 20 }).map((_, i) => (
        <Box key={i} label={`${i + 1}`} width={50} color={['#00C48C', '#FFCF5C', '#FF3D71'][i % 3]} />
      ))}
    </Flex>
  </Section>
);

export const FlexChildrenStyleExample = () => (
  <Section title="Flex — childrenStyle">
    <Flex
      vertical
      gap={8}
      childrenStyle={{ backgroundColor: '#E8F5E9', borderRadius: 6, padding: 8 }}
    >
      <Label value="Hijo 1 — estilo heredado" />
      <Label value="Hijo 2 — estilo heredado" />
      <Label value="Hijo 3 — estilo heredado" />
    </Flex>
  </Section>
);

export const FlexBackgroundExample = () => (
  <Section title="Flex — Background (string / ViewStyle)">
    <Flex vertical gap={12}>
      <Flex background="#E8F5E9" padding="m" rounded align="center">
        <Label type="detail" value="background='#E8F5E9'" />
      </Flex>

      <Flex
        background={{ backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FF9800' }}
        padding="m"
        rounded
        align="center"
      >
        <Label type="detail" value="background={ViewStyle} con border" />
      </Flex>
    </Flex>
  </Section>
);

export const FlexAllExamples = () => (
  <ScrollView contentContainerStyle={{ padding: 16 }}>
    <Label type="title" value="Flex Component Examples" />
    <FlexBasicExample />
    <FlexVerticalExample />
    <FlexJustifyExample />
    <FlexAlignExample />
    <FlexWrapExample />
    <FlexSpacingExample />
    <FlexRoundedExample />
    <FlexSizeExample />
    <FlexScrollExample />
    <FlexChildrenStyleExample />
    <FlexBackgroundExample />
  </ScrollView>
);

const styles = StyleSheet.create({
  box: {
    padding: 4,
  },
  child: {
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
