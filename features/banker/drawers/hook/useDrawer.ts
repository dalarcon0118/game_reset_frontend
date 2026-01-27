import { useDrawersStore } from "../core/store";
import {
  NAVIGATE_DATE,
  REFRESH_CLICKED,
  REPORT_CLICKED,
  SET_SELECTED_DATE,
  NAVIGATE_BACK
} from "../core/msg";
import { useDrawConfirmation } from "@/features/colector/drawers/hooks/useDrawConfirmation";

export const useDrawer = ({ id }: { id: number }) => {
  const model = useDrawersStore((state) => state.model);
  const dispatch = useDrawersStore((state) => state.dispatch);

  const { confirmDraw } = useDrawConfirmation({
    onSuccess: () => dispatch(REFRESH_CLICKED()),
    details: model.details.type === 'Success' ? model.details.data : null
  });

  return {
    selectedDate: model.selectedDate,
    setSelectedDate: (date: Date) => dispatch(SET_SELECTED_DATE(date)),
    handleNavigate: (days: number) => dispatch(NAVIGATE_DATE(days)),
    handleBack: () => dispatch(NAVIGATE_BACK()),
    refresh: () => dispatch(REFRESH_CLICKED()),
    details: model.details.type === 'Success' ? model.details.data : null,
    loading: model.details.type === 'Loading',
    error: model.details.type === 'Failure' ? model.details.error : null,
    handleReport: (drawId: number) => dispatch(REPORT_CLICKED(drawId)),
    confirmDraw,
  };
};