import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Input, Toggle, useTheme as useKittenTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronUp,
  User,
  Lock,
  Settings,
  Save,
  ArrowLeft,
  Moon,
  Sun,
  FileText
} from 'lucide-react-native';
import LayoutConstants from '@/constants/Layout';
import { Flex, Label, Card, IconBox, ButtonKit } from '@/shared/components';
import { useTheme } from '@/shared/hooks/useTheme';
import { withDataView } from '@/shared/components/withDataView';
import { useSettings } from './hooks/hook.settings';
import { TOGGLE_SECTION, SECURITY_FIELD_UPDATED, CHANGE_PASSWORD_REQUESTED, THEME_TOGGLED, ROUTER_BACK, FETCH_RULES_REQUESTED, TOGGLE_RULE_REQUESTED, MODIFY_RULE_REQUESTED } from './store/types';

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

const AccordionItem = ({ title, icon, isExpanded, onPress, children }: AccordionItemProps) => {
  const kittenTheme = useKittenTheme();
  const { colors } = useTheme();
  
  return (
    <Card style={styles.accordionCard} padding={0}>
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Flex vertical={false} align="center" justify="between" flex={1}>
          <Flex vertical={false} align="center">
            <IconBox 
              backgroundColor={kittenTheme['color-primary-100']} 
              size={32} 
              style={{ marginRight: LayoutConstants.spacing.md }}
            >
              {icon}
            </IconBox>
            <Label type="header" value={title} />
          </Flex>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.text} />
          ) : (
            <ChevronDown size={20} color={colors.text} />
          )}
        </Flex>
      </TouchableOpacity>
      
      {isExpanded && (
        <Flex 
          vertical
          padding="m" 
          style={styles.accordionContent}
        >
          {children}
        </Flex>
      )}
    </Card>
  );
};

const RulesList = ({
  rules,
  onModify,
  onToggleStatus
}: {
  rules: any[],
  onModify?: (rule: any) => void,
  onToggleStatus?: (rule: any, checked: boolean) => void
}) => {
  const { colors } = useTheme();

  return (
    <Flex vertical gap={8}>
      {rules.map((rule, index) => (
        <Card key={rule.id} style={{ backgroundColor: colors.background, borderRadius: 8 }}>
          <Flex vertical gap={8}>
            <Flex vertical={false} justify="between" align="center">
              <Label type="header" style={{ flex: 1, marginRight: 8 }} value={`${index + 1}. ${rule.name}`} />
              <Toggle
                checked={rule.isActivated ?? false}
                onChange={(checked) => onToggleStatus?.(rule, checked)}
                status="primary"
              />
            </Flex>
            <Label type="default" style={styles.ruleText} value={rule.description} />
            <Flex vertical={false} justify="end">
              <ButtonKit
                label="Modificar"
                size="small"
                status="primary"
                disabled={!(rule.isActivated ?? false)}
                onPress={() => onModify?.(rule)}
              />
            </Flex>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
};

const DataBoundRulesList = withDataView(RulesList);

const RulesSection = ({
  isExpanded,
  onToggle,
  rules,
  loading,
  error,
  onRetry,
  onModify,
  onToggleStatus
}: {
  isExpanded: boolean;
  onToggle: () => void;
  rules: any[] | null;
  loading: boolean;
  error: any;
  onRetry: () => void;
  onModify: (rule: any) => void;
  onToggleStatus: (rule: any, checked: boolean) => void;
}) => {
  const kittenTheme = useKittenTheme();

  return (
    <AccordionItem
      title="Listar Reglamento"
      icon={<FileText size={20} color={kittenTheme['color-primary-500']} />}
      isExpanded={isExpanded}
      onPress={onToggle}
    >
      <Flex vertical padding="m" gap={16}>
        <DataBoundRulesList
          loading={loading}
          error={error}
          isEmpty={!rules || rules.length === 0}
          onRetry={onRetry}
          rules={rules || []}
          onModify={onModify}
          onToggleStatus={onToggleStatus}
        />
      </Flex>
    </AccordionItem>
  );
};

export default function BankerSettingsScreen() {
  const { colors } = useTheme();
  const kittenTheme = useKittenTheme();
  const { user, security, preferences, rules, expandedSections, dispatch } = useSettings();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Flex align="center" gap={16} padding={16} style={styles.header}>
        <TouchableOpacity onPress={() => dispatch(ROUTER_BACK())}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Label type="title" value="Configuración" />
      </Flex>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Flex vertical gap={16}>
          {/* Usuario Section */}
          <AccordionItem
            title="Mi Perfil"
            icon={<User size={20} color={kittenTheme['color-primary-500']} />}
            isExpanded={expandedSections.includes('user')}
            onPress={() => dispatch(TOGGLE_SECTION('user'))}
          >
            <Flex vertical gap={12}>
              <Input
                label="Nombre"
                value={user?.name || ''}
                disabled
              />
              <Input
                label="Correo"
                value={user?.email || ''}
                disabled
              />
              <Input
                label="Rol"
                value={user?.role || ''}
                disabled
              />
            </Flex>
          </AccordionItem>

          {/* Reglamento Section */}
          <RulesSection
            isExpanded={expandedSections.includes('rules')}
            onToggle={() => dispatch(TOGGLE_SECTION('rules'))}
            rules={rules.data}
            loading={rules.loading}
            error={rules.error}
            onRetry={() => dispatch(FETCH_RULES_REQUESTED())}
            onModify={(rule) => dispatch(MODIFY_RULE_REQUESTED(rule))}
            onToggleStatus={(rule, checked) => dispatch(TOGGLE_RULE_REQUESTED(rule, checked))}
          />

          {/* Seguridad Section */}
          <AccordionItem
            title="Seguridad"
            icon={<Lock size={20} color={kittenTheme['color-primary-500']} />}
            isExpanded={expandedSections.includes('security')}
            onPress={() => dispatch(TOGGLE_SECTION('security'))}
          >
            <Flex vertical gap={12}>
              <Input
                label="Contraseña Actual"
                placeholder="********"
                secureTextEntry
                value={security.currentPassword}
                onChangeText={(v) => dispatch(SECURITY_FIELD_UPDATED('currentPassword', v))}
              />
              <Input
                label="Nueva Contraseña"
                placeholder="********"
                secureTextEntry
                value={security.newPassword}
                onChangeText={(v) => dispatch(SECURITY_FIELD_UPDATED('newPassword', v))}
              />
              <Input
                label="Confirmar Nueva Contraseña"
                placeholder="********"
                secureTextEntry
                value={security.confirmPassword}
                onChangeText={(v) => dispatch(SECURITY_FIELD_UPDATED('confirmPassword', v))}
              />
              {security.error && (
                <Label type="detail" style={{ color: colors.error }} value={security.error} />
              )}
              <ButtonKit
                label={security.loading ? "Actualizando..." : "Actualizar Contraseña"}
                disabled={security.loading || !security.currentPassword || !security.newPassword}
                onPress={() => dispatch(CHANGE_PASSWORD_REQUESTED())}
                accessoryLeft={security.loading ? undefined : (props) => <Save {...(props as any)} size={18} />}
              />
            </Flex>
          </AccordionItem>

          {/* Preferencias Section */}
          <AccordionItem
            title="Preferencias"
            icon={<Settings size={20} color={kittenTheme['color-primary-500']} />}
            isExpanded={expandedSections.includes('preferences')}
            onPress={() => dispatch(TOGGLE_SECTION('preferences'))}
          >
            <Flex vertical gap={16}>
              <Flex vertical={false} justify="between" align="center">
                <Flex vertical={false} align="center" gap={8}>
                  {preferences.theme === 'dark' ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
                  <Label type="default" value="Modo Oscuro" />
                </Flex>
                <Toggle
                  checked={preferences.theme === 'dark'}
                  onChange={() => dispatch(THEME_TOGGLED())}
                />
              </Flex>
            </Flex>
          </AccordionItem>
        </Flex>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  accordionCard: {
    marginBottom: 8,
    overflow: 'hidden',
  },
  accordionHeader: {
    padding: 16,
  },
  accordionContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  ruleText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
});
