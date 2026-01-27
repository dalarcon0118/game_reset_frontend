// Example: How to integrate useValidationRules in your bet editing component

import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useValidationRules } from '@/shared/hooks/use_validation_rules';
import { getValidationErrors } from '@/shared/utils/validation';

interface ExampleBetComponentProps {
    structureId: string; // User's listeria/bank ID
    betTypeId: string; // Fijo, Corrido, etc.
}

export function ExampleBetComponent({ structureId, betTypeId }: ExampleBetComponentProps) {
    const [betNumber, setBetNumber] = useState('');
    const [amount, setAmount] = useState(0);

    // Use the validation rules hook
    const {
        rules,
        validateSingleBet,
        isLoading,
        error
    } = useValidationRules({
        structureId, // This will fetch rules specific to the user's structure
        autoFetch: true
    });

    const handlePlaceBet = () => {
        // Validate the bet before submitting
        const validationResult = validateSingleBet({
            bet_number: betNumber,
            amount: amount,
            bet_type: betTypeId
        });

        if (!validationResult.isValid) {
            // Show validation errors to the user
            const errors = getValidationErrors(validationResult);
            Alert.alert(
                'Apuesta Inválida',
                errors.join('\n'),
                [{ text: 'OK' }]
            );
            return;
        }

        // Bet is valid, proceed with submission
        console.log('Bet is valid, submitting...');
        // ... submit bet logic
    };

    if (isLoading) {
        return <Text>Cargando reglas de validación...</Text>;
    }

    if (error) {
        return <Text>Error cargando reglas: {error.message}</Text>;
    }

    return (
        <View>
            <Text>Reglas activas: {rules.length}</Text>
            {/* Your bet input UI here */}
            {/* ... */}
        </View>
    );
}

// ============================================
// Example 2: Real-time validation as user types
// ============================================

export function RealTimeValidationExample({ structureId, betTypeId }: ExampleBetComponentProps) {
    const [betNumber, setBetNumber] = useState('');
    const [amount, setAmount] = useState(0);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const { validateSingleBet } = useValidationRules({ structureId });

    const handleAmountChange = (newAmount: number) => {
        setAmount(newAmount);

        // Validate in real-time
        const result = validateSingleBet({
            bet_number: betNumber,
            amount: newAmount,
            bet_type: betTypeId
        });

        if (!result.isValid) {
            setValidationErrors(getValidationErrors(result));
        } else {
            setValidationErrors([]);
        }
    };

    return (
        <View>
            {/* Show validation errors in real-time */}
            {validationErrors.map((error, index) => (
                <Text key={index} style={{ color: 'red' }}>
                    {error}
                </Text>
            ))}
        </View>
    );
}

// ============================================
// Example 3: Batch validation for multiple bets
// ============================================

export function BatchValidationExample({ structureId }: { structureId: string }) {
    const { validateMultipleBets } = useValidationRules({ structureId });

    const handleSaveAllBets = (bets: Array<{ bet_number: string; amount: number; bet_type: string }>) => {
        // Validate all bets at once
        const results = validateMultipleBets(bets);

        const invalidBets: number[] = [];
        results.forEach((result, index) => {
            if (!result.isValid) {
                invalidBets.push(index);
            }
        });

        if (invalidBets.length > 0) {
            Alert.alert(
                'Apuestas Inválidas',
                `${invalidBets.length} apuesta(s) no cumplen con las reglas`,
                [{ text: 'OK' }]
            );
            return;
        }

        // All bets are valid
        console.log('All bets valid, submitting...');
    };

    return <View>{/* Your UI */}</View>;
}
