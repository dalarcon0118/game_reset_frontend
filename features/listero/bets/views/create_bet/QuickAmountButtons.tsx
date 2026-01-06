import React from 'react';
import { Flex, ButtonKit } from '../../../../../shared/components';

interface QuickAmountButtonsProps {
  amounts: number[];
  onSelectAmount: (amount: number) => void;
}

export default function QuickAmountButtons({
  amounts,
  onSelectAmount,
}: QuickAmountButtonsProps) {
  return (
    <Flex vertical gap="s" style={{ width: '100%', marginTop: 8 }}>
      <Flex justify="between" gap="s">
        {amounts.slice(0, 3).map((amount) => (
          <ButtonKit
            key={`amount-${amount}`}
            label={`$${amount}`}
            appearance="outline"
            size="small"
            style={{ flex: 1 }}
            onPress={() => onSelectAmount(amount)}
          />
        ))}
      </Flex>
      <Flex justify="between" gap="s">
        {amounts.slice(3).map((amount) => (
          <ButtonKit
            key={`amount-${amount}`}
            label={`$${amount}`}
            appearance="outline"
            size="small"
            style={{ flex: 1 }}
            onPress={() => onSelectAmount(amount)}
          />
        ))}
      </Flex>
    </Flex>
  );
}
