import { useAuth } from '../../../auth';
import useDataFetch from "@/shared/hooks/use_data_fetch";
import { ListeroDetails, StructureService } from "@/shared/services/structure";
import { useTheme } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

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
        return StructureService.getListeroDetails(Number(id), formatDateToString(selectedDate));
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