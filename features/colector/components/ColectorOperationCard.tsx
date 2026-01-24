import React from 'react';
import { BaseOperationCard } from '@/shared/components/OperationCard/BaseOperationCard';
import { useFinancialStore, selectNodeFinancialSummary } from '@/shared/store/financial/store';
import { RemoteData } from '@/shared/core/remote.data';

interface ColectorOperationCardProps {
  nodeId: number;
  name: string;
  onPress?: () => void;
  onReglamentoPress?: () => void;
}

export const ColectorOperationCard: React.FC<ColectorOperationCardProps> = ({
  nodeId,
  name,
  onPress,
  onReglamentoPress
}) => {
  const financialData = useFinancialStore(selectNodeFinancialSummary(nodeId)) || RemoteData.notAsked();

  return (
    <BaseOperationCard
      name={name}
      financialData={financialData}
      onPress={onPress}
      onReglamentoPress={onReglamentoPress}
    />
  );
};
