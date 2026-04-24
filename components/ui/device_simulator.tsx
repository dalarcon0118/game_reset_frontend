import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, useColorScheme, useWindowDimensions } from 'react-native';
import StyledText from '../typography/styled_text';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

export interface DeviceConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  dpi: number;
  diagonalInches: number;
}

export const DEVICE_PRESETS: DeviceConfig[] = [
  {
    id: 'samsung-s10',
    name: 'Samsung Galaxy S10',
    width: 360,
    height: 760,
    dpi: 550,
    diagonalInches: 6.1,
  },
  {
    id: 'xiaomi-11',
    name: 'Xiaomi 11',
    width: 393,
    height: 851,
    dpi: 515,
    diagonalInches: 6.81,
  },
  {
    id: 'xiaomi-13',
    name: 'Xiaomi 13',
    width: 393,
    height: 873,
    dpi: 414,
    diagonalInches: 6.36,
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    dpi: 460,
    diagonalInches: 6.1,
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    dpi: 326,
    diagonalInches: 4.7,
  },
  {
    id: 'pixel-7',
    name: 'Google Pixel 7',
    width: 412,
    height: 915,
    dpi: 440,
    diagonalInches: 6.3,
  },
];

interface DeviceSimulatorProps {
  visible?: boolean;
  initialDeviceId?: string;
  onDeviceChange?: (device: DeviceConfig) => void;
  children?: React.ReactNode;
}

export default function DeviceSimulator({
  visible = true,
  initialDeviceId = 'samsung-s10',
  onDeviceChange,
  children,
}: DeviceSimulatorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [selectedDeviceId, setSelectedDeviceId] = useState(initialDeviceId);

  const device = useMemo(() => 
    DEVICE_PRESETS.find(d => d.id === selectedDeviceId) ?? DEVICE_PRESETS[0],
    [selectedDeviceId]
  );

  const { scale, scaledWidth, scaledHeight } = useMemo(() => {
    const scaleX = screenWidth / device.width;
    const scaleY = screenHeight / device.height;
    const calculatedScale = Math.min(scaleX, scaleY) * 0.9;
    
    const sw = device.width * calculatedScale;
    const sh = device.height * calculatedScale;
    
    return {
      scale: calculatedScale,
      scaledWidth: sw,
      scaledHeight: sh,
    };
  }, [screenWidth, screenHeight, device]);

  const handleDeviceChange = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const newDevice = DEVICE_PRESETS.find(d => d.id === deviceId);
    if (newDevice && onDeviceChange) {
      onDeviceChange(newDevice);
    }
  }, [onDeviceChange]);

  if (!visible) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.simulatorWrapper}>
        <View
          style={[
            styles.deviceFrame,
            {
              width: scaledWidth,
              height: scaledHeight,
              borderColor: Colors[colorScheme].primary,
              backgroundColor: Colors[colorScheme].card,
            },
          ]}
        >
          <View style={styles.statusBar}>
            <StyledText size="xs" style={{ color: Colors[colorScheme].textSecondary }}>
              {device.name}
            </StyledText>
            <StyledText size="xs" style={{ color: Colors[colorScheme].textSecondary }}>
              {device.width}×{device.height}
            </StyledText>
          </View>
          <View
            style={[
              styles.appContainer,
              {
                transform: [{ scale }],
              },
            ]}
          >
            {children}
          </View>
        </View>
      </View>

      <View style={[styles.controlsPanel, { backgroundColor: Colors[colorScheme].card }]}>
        <View style={styles.header}>
          <StyledText weight="semibold" size="md" style={{ color: Colors[colorScheme].text }}>
            Device Simulator
          </StyledText>
          <View style={[styles.badge, { backgroundColor: Colors[colorScheme].success }]}>
            <StyledText size="xs" style={{ color: '#FFFFFF' }}>
              {device.dpi} dpi
            </StyledText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.devicesList}
        >
          {DEVICE_PRESETS.map((d) => {
            const isSelected = d.id === selectedDeviceId;
            return (
              <Pressable
                key={d.id}
                onPress={() => handleDeviceChange(d.id)}
                style={[
                  styles.deviceChip,
                  {
                    backgroundColor: isSelected
                      ? Colors[colorScheme].primary
                      : Colors[colorScheme].backgroundSecondary,
                    borderColor: isSelected
                      ? Colors[colorScheme].primary
                      : Colors[colorScheme].border,
                  },
                ]}
              >
                <StyledText
                  weight={isSelected ? 'semibold' : 'regular'}
                  size="xs"
                  style={{
                    color: isSelected ? '#FFFFFF' : Colors[colorScheme].text,
                  }}
                >
                  {d.name.split(' ')[1] ?? d.name}
                </StyledText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.infoRow, { borderTopColor: Colors[colorScheme].border }]}>
          <InfoItem label="Scale" value={`${scale.toFixed(2)}x`} />
          <InfoItem label="Display" value={`${device.diagonalInches}"`} />
          <InfoItem label="Screen" value={`${device.width}×${device.height}`} />
        </View>
      </View>
    </View>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={styles.infoItem}>
      <StyledText size="xs" style={{ color: Colors[colorScheme].textSecondary }}>
        {label}
      </StyledText>
      <StyledText weight="medium" size="sm" style={{ color: Colors[colorScheme].text }}>
        {value}
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  simulatorWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceFrame: {
    borderWidth: 3,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  appContainer: {
    flex: 1,
    transformOrigin: 'top left',
  },
  controlsPanel: {
    position: 'absolute',
    bottom: Layout.spacing.lg,
    left: Layout.spacing.md,
    right: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  badge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  devicesList: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
    paddingVertical: Layout.spacing.xs,
  },
  deviceChip: {
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  infoItem: {
    alignItems: 'center',
  },
});