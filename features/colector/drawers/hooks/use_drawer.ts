import { useAuth } from '../../../auth';
import useDataFetch from "@/shared/hooks/use_data_fetch";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "@ui-kitten/components";
import { structureRepository, ListeroDetails } from "@/shared/repositories/structure";

const formatDateToString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const useDrawer = ({ id }: { id: number }) => {
    const router = useRouter();
    const theme = useTheme();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const { isAuthenticated } = useAuth();


    const handleReport = useCallback((drawId: number) => {
        router.push({
            pathname: '/colector/reports/form',
            params: { id: String(id), drawId: String(drawId) }
        });
    }, [id, router]);

    const fetchDetails = useCallback(() => {
        return structureRepository.getListeroDetails(Number(id), formatDateToString(selectedDate));
    }, [id, selectedDate]);

    const [refresh, details, loading, error] = useDataFetch<ListeroDetails>(fetchDetails);

    useEffect(() => {
        if (id && isAuthenticated) {
            refresh();
        }
    }, [id, selectedDate, isAuthenticated]);

    const handleNavigate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        if (newDate > new Date()) return;
        setSelectedDate(newDate);
    };
    return {
        selectedDate,
        setSelectedDate,
        router,
        refresh,
        handleNavigate,
        details,
        loading,
        error,
        theme,
        formatDateToString,
        handleReport
    };
}