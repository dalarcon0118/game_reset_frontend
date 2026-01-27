import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Flex } from '@shared/components';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { Datepicker } from '@ui-kitten/components';
import { useTheme } from '@shared/hooks/use_theme';

interface DateNavigationProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    onNavigate: (days: number) => void;
}

const formatDateToString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const DateNavigation: React.FC<DateNavigationProps> = ({
    selectedDate,
    onDateChange,
    onNavigate
}) => {
    const { colors, spacing } = useTheme();

    const isToday = formatDateToString(selectedDate) === formatDateToString(new Date());

    const canNavigateForward = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        return newDate <= new Date();
    };

    return (
        <Flex
            align="center"
            justify="between"
            style={[
                styles.dateSelector,
                {
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    backgroundColor: colors.surface
                }
            ]}
        >
            <TouchableOpacity
                onPress={() => onNavigate(-1)}
                style={styles.navButton}
            >
                <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.pickerContainer}>
                <Datepicker
                    date={selectedDate}
                    onSelect={onDateChange}
                    max={new Date()}
                    accessoryRight={(props: any) => (
                        <Calendar
                            size={18}
                            color={isToday ? colors.primary : colors.textSecondary}
                            {...props}
                        />
                    )}
                    controlStyle={{
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        paddingHorizontal: 0
                    }}
                />
            </View>

            <TouchableOpacity
                onPress={() => onNavigate(1)}
                disabled={!canNavigateForward(1)}
                style={styles.navButton}
            >
                <ChevronRight
                    size={24}
                    color={!canNavigateForward(1) ? colors.border : colors.primary}
                />
            </TouchableOpacity>
        </Flex>
    );
};

const styles = StyleSheet.create({
    dateSelector: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    pickerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navButton: {
        padding: 8,
    },
});
