import React from 'react';
import { StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Input, Toggle, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronUp,
  User,
  Lock,
  FileText,
  Settings,
  Save
} from 'lucide-react-native';
import LayoutConstants from '@/constants/Layout';
import { Flex, Label, Card, IconBox, ButtonKit } from '@/shared/components';
import { useAuth } from '../../auth';
import { withDataView } from '@/shared/components/withDataView';
import { User as UserType } from '@/data/mockData';
import { useSettings } from './hooks/hook.settings';

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

const AccordionItem = ({ title, icon, isExpanded, onPress, children }: AccordionItemProps) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.accordionCard} padding={0}>
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Flex vertical={false} align="center" justify="between" flex={1}  margin={[{type:"top",value:10}]}>
          <Flex vertical={false} align="center">
            <IconBox 
              backgroundColor={theme['color-primary-100']} 
              size={20} 
              style={{ marginRight: LayoutConstants.spacing.md }}
            >
              {icon}
            </IconBox>
            <Label type="header">{title}</Label>
          </Flex>
          {isExpanded ? (
            <ChevronUp size={12} color={theme['text-basic-color']} />
          ) : (
            <ChevronDown size={12} color={theme['text-basic-color']} />
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

const UserSection = ({ isExpanded, onToggle, user }: { isExpanded: boolean; onToggle: () => void; user: UserType | null }) => {
  const theme = useTheme();
  return (
    <AccordionItem
      title="Usuario"
      icon={<User size={20} color={theme['color-primary-500']} />}
      isExpanded={isExpanded}
      onPress={onToggle}
    >
      <Flex vertical padding="m" gap={12}>
        <Input
          label="Nombre completo"
          placeholder="Juan Pérez"
          value={user?.name || ''}
          disabled
        />
        <Input
          label="Correo electrónico"
          placeholder="juan.perez@ejemplo.com"
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
  );
};

const PasswordSection = ({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) => {
  const theme = useTheme();
  return (
    <AccordionItem
      title="Cambiar Contraseña"
      icon={<Lock size={20} color={theme['color-primary-500']} />}
      isExpanded={isExpanded}
      onPress={onToggle}
    >
      <Flex vertical padding="m" gap={12}>
        <Input
          label="Contraseña Actual"
          placeholder="********"
          secureTextEntry={true}
        />
        <Input
          label="Nueva Contraseña"
          placeholder="********"
          secureTextEntry={true}
        />
        <Input
          label="Confirmar Nueva Contraseña"
          placeholder="********"
          secureTextEntry={true}
        />
        <ButtonKit 
          label="Actualizar Contraseña"
          accessoryLeft={() => <Save size={18} color="white" />}
          style={{ marginTop: 8 }}
        />
      </Flex>
    </AccordionItem>
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
  const theme = useTheme();

  return (
    <Flex vertical gap={4} >
      {rules.map((rule, index) => (
        <Card key={rule.id} style={{ backgroundColor: theme['background-basic-color-1'], borderRadius: 8 }} >
          <Flex vertical gap={12}>
            <Flex vertical={false} justify="between" align="center">
              <Label type="header" style={{ flex: 1, marginRight: 8 }}>{`${index + 1}. ${rule.name}`}</Label>
              <Toggle
                checked={rule.isActivated ?? rule.is_active ?? false}
                onChange={(checked) => onToggleStatus?.(rule, checked)}
                status="primary"
                style={{ transform: [{ scale: 0.7 }] }}
              />
            </Flex>

            <Label type="default" style={styles.ruleText}>
              {rule.description}
            </Label>

            <Flex vertical={false} justify="end">
              <ButtonKit
                label="Modificar"
                size="small"
                status="primary"
                disabled={!(rule.isActivated ?? rule.is_active ?? false)}
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
  const theme = useTheme();

  return (
    <AccordionItem
      title="Listar Reglamento"
      icon={<FileText size={20} color={theme['color-primary-500']} />}
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

const ModulesSection = ({ 
  isExpanded, 
  onToggle, 
  modules, 
  onToggleModule 
}: { 
  isExpanded: boolean; 
  onToggle: () => void;
  modules: any;
  onToggleModule: (key: any) => void;
}) => {
  const theme = useTheme();
  return (
    <AccordionItem
      title="Módulos Activos"
      icon={<Settings size={20} color={theme['color-primary-500']} />}
      isExpanded={isExpanded}
      onPress={onToggle}
    >
      <Flex vertical padding="m">
        <ModuleRow
          title="Notificaciones Push"
          description="Recibir alertas de nuevos sorteos"
          checked={modules.notifications}
          onChange={() => onToggleModule('notifications')}
        />
        
        <ModuleRow
          title="Análisis Avanzado"
          description="Gráficas y reportes detallados"
          checked={modules.analytics}
          onChange={() => onToggleModule('analytics')}
        />

        <ModuleRow
          title="Actualizaciones Real-time"
          description="Sincronización instantánea"
          checked={modules.realTimeUpdates}
          onChange={() => onToggleModule('realTimeUpdates')}
        />

        <ModuleRow
          title="Modo Offline"
          description="Permitir trabajo sin conexión"
          checked={modules.offlineMode}
          onChange={() => onToggleModule('offlineMode')}
          isLast
        />
      </Flex>
    </AccordionItem>
  );
};

export default function SettingsScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // Usar el custom hook para toda la lógica
  const {
    expandedSection,
    refreshing,
    modules,
    rules,
    rulesLoading,
    rulesError,
    toggleSection,
    onRefresh,
    onRetryRules,
    handleToggleModule,
    handleModifyRule,
    handleToggleRuleStatus,
  } = useSettings();

  return (
    <Flex vertical flex={1} background={theme['background-basic-color-1']}>
      <SafeAreaView style={styles.safeArea}>
        <Flex vertical padding={{ type: 'horizontal', value: 'l' }} margin={{ type: 'vertical', value: 'l' }}>
          <Label type="title">Ajustes</Label>
          <Label type="detail">Configuración del sistema</Label>
        </Flex>

        <Flex 
          vertical
          scroll={{
            contentContainerStyle: styles.scrollContent,
            showsVerticalScrollIndicator: false,
            refreshControl: (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme['color-primary-500']]}
                tintColor={theme['color-primary-500']}
              />
            )
          }}
        >
          <Flex vertical gap={16} margin={[{type:"bottom",value:10}]}>
            <UserSection 
              isExpanded={expandedSection === 'user'} 
              onToggle={() => toggleSection('user')}
              user={user}
            />
            
            <PasswordSection 
              isExpanded={expandedSection === 'password'} 
              onToggle={() => toggleSection('password')} 
            />
            
            <RulesSection
              isExpanded={expandedSection === 'rules'}
              onToggle={() => toggleSection('rules')}
              rules={rules}
              loading={rulesLoading}
              error={rulesError}
              onRetry={onRetryRules}
              onModify={handleModifyRule}
              onToggleStatus={handleToggleRuleStatus}
            />

            <ModulesSection 
              isExpanded={expandedSection === 'modules'} 
              onToggle={() => toggleSection('modules')}
              modules={modules}
              onToggleModule={handleToggleModule}
            />
          </Flex>
        </Flex>
      </SafeAreaView>
    </Flex>
  );
}

interface ModuleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  isLast?: boolean;
}

const ModuleRow = ({ title, description, checked, onChange, isLast }: ModuleRowProps) => (
  <Flex 
    vertical={false} 
    align="center" 
    justify="between" 
    padding={{ type: 'vertical', value: 's' }}
    style={!isLast && styles.moduleRowBorder}
  >
    <Flex vertical flex={1} margin={{ type: 'right', value: 'l' }}>
      <Label type="header">{title}</Label>
      <Label type="detail">{description}</Label>
    </Flex>
    <Toggle
      checked={checked}
      onChange={onChange}
    />
  </Flex>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    paddingHorizontal: LayoutConstants.spacing.md,
    paddingBottom: LayoutConstants.spacing.xl,
  },
  accordionCard: {
    marginBottom: LayoutConstants.spacing.xs,
  },
  accordionHeader: {
    padding: LayoutConstants.spacing.md,
  },
  accordionContent: {
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  ruleText: {
    marginTop: 4,
    lineHeight: 20,
  },
  moduleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
});
