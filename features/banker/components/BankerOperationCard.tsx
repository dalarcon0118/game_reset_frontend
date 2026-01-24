import React from 'react';
import { BaseOperationCard } from '@/shared/components/OperationCard/BaseOperationCard';
import { useFinancialStore, selectNodeFinancialSummary } from '@/shared/store/financial/store';
import { RemoteData } from '@/shared/core/remote.data';

interface BankerOperationCardProps {
  nodeId: number;
  name: string;
  onPress?: () => void;
  onReglamentoPress?: () => void;
}

export const BankerOperationCard: React.FC<BankerOperationCardProps> = ({
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
