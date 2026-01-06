import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Select, SelectItem, Input } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, Label, Card, ButtonKit, IconBox } from '@/shared/components';
import { useTheme } from '@/shared/hooks/useTheme';
import { ArrowLeft, AlertTriangle, CheckCircle2, MapPin, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useReportsForm, INCIDENT_TYPES } from './hooks/useReportsForm';

export default function BankerReportsFormScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const {
    selectedTypeIndex,
    selectedAgencyIndex,
    description,
    isSubmitted,
    isSubmitting,
    displayType,
    displayAgency,
    drawName,
    agencies,
    loadingAgencies,
    setSelectedTypeIndex,
    setSelectedAgencyIndex,
    setDescription,
    handleSubmit,
  } = useReportsForm();

  if (isSubmitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Flex flex={1} vertical justify="center" align="center" padding={spacing.xl}>
          <IconBox
            size={80}
            backgroundColor="#F0FFF4"
            style={{ marginBottom: spacing.lg }}
          >
            <CheckCircle2 size={40} color="#38A169" />
          </IconBox>
          <Label type="header" value="¡Reporte Enviado!" style={{ marginBottom: spacing.sm }} />
          <Label
            type="detail"
            style={{ textAlign: 'center' }}
            value="La incidencia ha sido registrada correctamente y será revisada por el equipo de soporte."
          />
          <ButtonKit
            label="Volver a Reportes"
            status="primary"
            style={{ marginTop: spacing.xxl, width: '100%' }}
            onPress={() => router.back()}
          />
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Flex vertical flex={1}>
        {/* Header */}
        <Flex align="center" gap={spacing.md} padding={spacing.lg} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Label type="title" value="Reportar Incidencia Bancaria" />
        </Flex>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Card style={styles.formCard}>
            <Flex vertical gap={spacing.lg}>
              
              {/* Context Information */}
              <View style={styles.contextContainer}>
                 <Flex vertical gap={spacing.sm}>
                    <Label type="detail" value="Detalles del Reporte" style={{ fontWeight: '600', marginBottom: 4, color: '#4A5568' }} />
                    
                    {/* Agency Selection */}
                    <Flex vertical gap={4}>
                      <Flex align="center" gap={spacing.sm}>
                         <MapPin size={16} color="#718096" />
                         <Label type="detail" value="Agencia:" style={{ fontWeight: '500', color: '#718096' }} />
                      </Flex>
                      
                      {loadingAgencies ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginLeft: 24 }} />
                      ) : (
                        <Select
                          selectedIndex={selectedAgencyIndex}
                          value={displayAgency}
                          onSelect={index => setSelectedAgencyIndex(index)}
                          style={[styles.select, { marginTop: 4 }]}
                          placeholder="Seleccionar Agencia"
                        >
                          {agencies.map(agency => (
                            <SelectItem key={agency.id} title={agency.name} />
                          ))}
                        </Select>
                      )}
                    </Flex>
                    
                    {drawName && (
                      <Flex align="center" gap={spacing.sm} style={{ marginTop: 8 }}>
                         <Calendar size={16} color="#718096" />
                         <Label type="default" value={drawName} style={{ fontWeight: '500' }} />
                      </Flex>
                    )}
                 </Flex>
              </View>

              <Flex vertical gap={spacing.xs}>
                <Label type="detail" value="Tipo de Incidencia" style={styles.inputLabel} />
                <Select
                  selectedIndex={selectedTypeIndex}
                  value={displayType}
                  onSelect={index => setSelectedTypeIndex(index)}
                  style={styles.select}
                >
                  {INCIDENT_TYPES.map(item => (
                    <SelectItem key={item.title} title={item.title} />
                  ))}
                </Select>
              </Flex>

              <Flex vertical gap={spacing.xs}>
                <Label type="detail" value="Descripción detallada" style={styles.inputLabel} />
                <Input
                  multiline={true}
                  placeholder="Explica qué sucedió..."
                  textStyle={{ minHeight: 120, textAlignVertical: 'top' }}
                  value={description}
                  onChangeText={setDescription}
                  style={styles.input}
                />
              </Flex>

              <View style={styles.disclaimerContainer}>
                <Flex align="start" gap={spacing.sm}>
                  <AlertTriangle size={18} color="#C05621" style={{ marginTop: 2 }} />
                  <Label
                    type="detail"
                    value="Este reporte será visible para los administradores y quedará asociado a tu cuenta bancaria."
                    style={{ color: '#7B341E', fontSize: 13 }}
                  />
                </Flex>
              </View>

              <ButtonKit
                label={isSubmitting ? "" : "Enviar Reporte"}
                onPress={handleSubmit}
                status="primary"
                style={{ marginTop: spacing.md }}
                disabled={isSubmitting}
                accessoryLeft={isSubmitting ? () => <ActivityIndicator size="small" color="#FFF" /> : undefined}
              />
            </Flex>
          </Card>
        </ScrollView>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputLabel: {
    fontWeight: '600',
    color: '#4A5568',
    marginLeft: 2,
  },
  select: {
    backgroundColor: '#F7FAFC',
  },
  input: {
    backgroundColor: '#F7FAFC',
  },
  contextContainer: {
    backgroundColor: '#EDF2F7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  disclaimerContainer: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEEBC8',
  }
});
