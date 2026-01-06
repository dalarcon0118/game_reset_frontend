import React from 'react';
import { View } from 'react-native';
import { DrawRules } from '@/types/rules';
import RuleCard from './RuleCard';

interface RulesContentProps {
  rules: DrawRules;
}

export default function RulesContent({ rules }: RulesContentProps) {
  console.log(rules);
  return (
    <>
      <RuleCard
        title="Límites de apuestas"
        rules={[
          { label: 'Fijo', value: rules.betLimits.fijo },
          { label: 'Corrido', value: rules.betLimits.corrido },
          { label: 'Parlet', value: rules.betLimits.parlet },
          { label: 'Centena', value: rules.betLimits.centena },
        ]}
      />

      <RuleCard
        title="Premios por 1$"
        rules={[
          { label: 'Fijo', value: rules.prizesPerDollar.fijo },
          { label: 'Corrido', value: rules.prizesPerDollar.corrido },
          { label: 'Parlet', value: rules.prizesPerDollar.parlet },
          { label: 'Centena', value: rules.prizesPerDollar.centena },
        ]}
      />

      <RuleCard
        title="Premios Limitados por 1$"
        rules={[
          { label: 'Fijo', value: rules.limitedPrizesPerDollar.fijo },
          { label: 'Corrido', value: rules.limitedPrizesPerDollar.corrido },
          { label: 'Parlet', value: rules.limitedPrizesPerDollar.parlet },
          { label: 'Centena', value: rules.limitedPrizesPerDollar.centena },
        ]}
      />

      <RuleCard
        title="Ganancia por 1$"
        rules={[
          { label: 'Fijo', value: `${rules.profitPercentage.fijo} %` },
          { label: 'Corrido', value: `${rules.profitPercentage.corrido} %` },
          { label: 'Parlet', value: `${rules.profitPercentage.parlet} %` },
          { label: 'Centena', value: `${rules.profitPercentage.centena} %` },
        ]}
      />

      <RuleCard
        title="Limitados del Fijo y el Corrido"
        rules={[
          { label: 'Día', value: rules.limitedNumbers.day.join('-') },
          { label: 'Noche', value: rules.limitedNumbers.night.join('-') },
        ]}
      />

      <RuleCard
        title="Limitados del Parlet"
        rules={[
          { 
            label: 'Día', 
            value: rules.parletLimits.day.length > 0 
              ? rules.parletLimits.day.join('-') 
              : 'No hay limitados'
          },
        ]}
      />
    </>
  );
}