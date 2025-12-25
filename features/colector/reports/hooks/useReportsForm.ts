import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { IndexPath } from '@ui-kitten/components';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/shared/context/AuthContext';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { StructureService, ChildStructure, ListeroDetails } from '@/shared/services/Structure';
import { IncidentService } from '@/shared/services/Incident';
import { DrawService } from '@/shared/services/Draw';

const INCIDENT_TYPES = [
  { title: 'Diferencia de Monto' },
  { title: 'Premio No Registrado' },
  { title: 'Premio No Pagado' },
  { title: 'Jugadas anotadas incorrectamente' },
  { title: 'Inyección de nuevos fondos' },
  { title: 'Otro' },
];

export interface ReportsFormState {
  // Selection states
  selectedListeroIndex: IndexPath | IndexPath[];
  selectedDrawIndex: IndexPath | IndexPath[];
  selectedTypeIndex: IndexPath | IndexPath[];

  // Form states
  description: string;
  isSubmitted: boolean;
  isSubmitting: boolean;

  // Data states
  listeros: ChildStructure[] | null;
  drawsDetail: ListeroDetails | null;
  loadingListeros: boolean;
  loadingDraws: boolean;

  // Computed display values
  displayListero: string;
  displayDraw: string;
  displayType: string;
}

export interface ReportsFormActions {
  setSelectedListeroIndex: (index: IndexPath | IndexPath[]) => void;
  setSelectedDrawIndex: (index: IndexPath | IndexPath[]) => void;
  setSelectedTypeIndex: (index: IndexPath | IndexPath[]) => void;
  setDescription: (description: string) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

export function useReportsForm(): ReportsFormState & ReportsFormActions {
  const router = useRouter();
  const { user } = useAuth();
  const { drawId, id: listeroId } = useLocalSearchParams();

  // Selection states
  const [selectedListeroIndex, setSelectedListeroIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));
  const [selectedDrawIndex, setSelectedDrawIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));
  const [selectedTypeIndex, setSelectedTypeIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));

  // Form states
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs to track if initial loading is done
  const listerosLoadedRef = useRef(false);
  const drawsLoadedRef = useRef(false);

  // Data fetching
  const [fetchListeros, listeros, loadingListeros] = useDataFetch<ChildStructure[], [number]>(StructureService.getChildren);
  const [fetchDraws, drawsDetail, loadingDraws] = useDataFetch<ListeroDetails, [number]>(StructureService.getListeroDetails);

  // Initial load: Fetch Listeros
  useEffect(() => {
    if (user?.structure?.id) {
      fetchListeros(user.structure.id);
    }
  }, [user?.structure?.id, fetchListeros]);

  // Handle Listero Selection Change or Pre-selection
  useEffect(() => {
    const listeroList = listeros || [];
    if (listeroList.length > 0) {
      let listeroIdx = (selectedListeroIndex as IndexPath).row;

      // If we have a listeroId from params, try to find it first
      if (listeroId && !listerosLoadedRef.current) {
        const foundIdx = listeroList.findIndex(l => l.id === Number(listeroId));
        if (foundIdx !== -1) {
          listeroIdx = foundIdx;
          setSelectedListeroIndex(new IndexPath(foundIdx));
          listerosLoadedRef.current = true;
        }
      }

      const selectedListero = listeroList[listeroIdx];
      if (selectedListero) {
        fetchDraws(selectedListero.id);
      }
    }
  }, [listeros, selectedListeroIndex, listeroId, fetchDraws]);

  // Handle Draw Pre-selection
  useEffect(() => {
    const draws = drawsDetail?.draws || [];
    if (draws.length > 0 && drawId && !drawsLoadedRef.current) {
      const foundIdx = draws.findIndex(d => d.draw_id === Number(drawId));
      if (foundIdx !== -1) {
        setSelectedDrawIndex(new IndexPath(foundIdx));
        drawsLoadedRef.current = true;
      }
    }
  }, [drawsDetail, drawId]);

  // Computed display values
  const listeroItems = listeros || [];
  const drawItems = drawsDetail?.draws || [];

  const displayListero = listeroItems.length > 0
    ? listeroItems[(selectedListeroIndex as IndexPath).row]?.name || 'Seleccione...'
    : 'Cargando...';

  const displayDraw = drawItems.length > 0
    ? drawItems[(selectedDrawIndex as IndexPath).row]?.draw_name || 'Seleccione...'
    : loadingDraws ? 'Cargando sorteos...' : 'No hay sorteos';

  const displayType = INCIDENT_TYPES[(selectedTypeIndex as IndexPath).row].title;

  const handleSubmit = async () => {
    // Basic validation
    if (!description.trim()) {
      Alert.alert('Incompleto', 'Por favor, ingresa una descripción de la incidencia.');
      return;
    }

    const selectedListero = listeroItems[(selectedListeroIndex as IndexPath).row];
    const selectedDraw = drawItems[(selectedDrawIndex as IndexPath).row];

    if (!selectedListero) {
      Alert.alert('Incompleto', 'Por favor, selecciona un listero.');
      return;
    }

    try {
      setIsSubmitting(true);

      await IncidentService.create({
        structure: selectedListero.id,
        draw: selectedDraw?.draw_id || null,
        incident_type: displayType,
        description,
      });

      // Update draw status to reported after incident creation
      await DrawService.updateStatus(selectedDraw?.draw_id || 0, 'reported');

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedListeroIndex(new IndexPath(0));
    setSelectedDrawIndex(new IndexPath(0));
    setSelectedTypeIndex(new IndexPath(0));
    setDescription('');
    setIsSubmitted(false);
    setIsSubmitting(false);
    listerosLoadedRef.current = false;
    drawsLoadedRef.current = false;
  };

  return {
    // State
    selectedListeroIndex,
    selectedDrawIndex,
    selectedTypeIndex,
    description,
    isSubmitted,
    isSubmitting,
    listeros,
    drawsDetail,
    loadingListeros,
    loadingDraws,
    displayListero,
    displayDraw,
    displayType,

    // Actions
    setSelectedListeroIndex,
    setSelectedDrawIndex,
    setSelectedTypeIndex,
    setDescription,
    handleSubmit,
    resetForm,
  };
}

export { INCIDENT_TYPES };
