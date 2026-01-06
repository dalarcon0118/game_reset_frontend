import { useDrawConfirmation } from "@/features/colector/drawers/hooks/useDrawConfirmation";
import { useAuth } from "@/shared/context/AuthContext";
import useDataFetch from "@/shared/hooks/useDataFetch";
import { ListeroDetails, StructureService } from "@/shared/services/Structure";
import { useTheme } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";


const formatDateToString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const useDrawer = ({ id }: { id: number }) => {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleReport = useCallback((id: number) => {
    // Navigate to report form, reusing colector's or separate banker route?
    // Assuming reusing colector's for now or just logging
    // TODO: Define route for banker reports
    router.push({
      pathname: '/banker/reports/form',
      params: { id: String(id) }
    });
  }, [id, router]);


  const fetchDetails = useCallback(() => {
    return StructureService.getListeroDetails(Number(id), formatDateToString(selectedDate));
  }, [id, selectedDate]);

  const { isAuthenticated } = useAuth();
  const [refresh, details, loading, error] = useDataFetch<ListeroDetails>(fetchDetails);
  const theme = useTheme();

  useEffect(() => {
    if (id && isAuthenticated) {
      refresh();
    }
  }, [id, selectedDate, refresh, isAuthenticated]);

  const handleNavigate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate > new Date()) return;
    setSelectedDate(newDate);
  };

  const { confirmDraw } = useDrawConfirmation({
    onSuccess: refresh,
    details
  });

  return {
    selectedDate,
    setSelectedDate,
    handleNavigate,
    refresh,
    details,
    loading,
    error,
    handleReport,
    confirmDraw,
    theme,
    router
  }
}