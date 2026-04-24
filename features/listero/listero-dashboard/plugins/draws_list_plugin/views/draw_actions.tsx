import React from 'react';
import { StyleSheet } from 'react-native';
import { match } from 'ts-pattern';
import { ButtonKit, Flex } from '@/shared/components';
import { DRAW_STATUS, DrawStatus } from '@/types';
import { Draw } from '../core/types';

interface DrawActionsProps {
  effectiveStatus: DrawStatus;
  onBetsListPress: (id: string, title: string, draw: Draw) => void;
  onCreateBetPress: (id: string, title: string, draw: Draw) => void;
  draw: Draw;
}

const DrawActions: React.FC<DrawActionsProps> = ({
  effectiveStatus,

  onBetsListPress,
  onCreateBetPress,
  draw,
}) => {
  const drawId = draw.id.toString();
  const drawTitle = draw.source || '';

  const isListDisabled = match(effectiveStatus)
    .with(DRAW_STATUS.SCHEDULED, DRAW_STATUS.PENDING, () => true)
    .otherwise(() => false);

  const createBetLabel = match(effectiveStatus)
    .with(DRAW_STATUS.SCHEDULED, DRAW_STATUS.PENDING, () => 'Próximamente')
    .with(DRAW_STATUS.CLOSED, () => 'Cerrado')
    .otherwise(() => 'Anotar');

  const isCreateBetDisabled = match(effectiveStatus)
    .with(DRAW_STATUS.SCHEDULED, DRAW_STATUS.PENDING, DRAW_STATUS.CLOSED, () => true)
    .otherwise(() => false);

  return (
    <Flex gap={8} style={styles.actionsRow}>
      

      <ButtonKit
        appearance="outline"
        status="primary"
        size="small"
        disabled={isListDisabled}
        style={[
          styles.actionButton,
          isListDisabled && styles.disabledButton,
        ]}
        onPress={() => onBetsListPress(drawId, drawTitle, draw)}
        label="Ver Lista"
      />

      {effectiveStatus === DRAW_STATUS.CLOSED && (
        <ButtonKit
          appearance="filled"
          status="primary"
          size="small"
          style={styles.actionButton}
          onPress={() => onRewardsPress(drawId, drawTitle, draw)}
          label="Premios"
        />
      )}
      

      {effectiveStatus !== DRAW_STATUS.CLOSED && (
        <ButtonKit
          appearance="filled"
          status="primary"
          size="small"
          disabled={isCreateBetDisabled}
          style={[
            styles.actionButton,
            isCreateBetDisabled && styles.disabledButton,
          ]}
          onPress={() => onCreateBetPress(drawId, drawTitle, draw)}
          label={createBetLabel}
        />
      )}
    </Flex>
  );
};

const styles = StyleSheet.create({
  actionsRow: {
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#EDF1F7',
    borderColor: '#E4E9F2',
  },
  reglamentoButton: {
    flex: 0.7,
  },
});

export default DrawActions;
