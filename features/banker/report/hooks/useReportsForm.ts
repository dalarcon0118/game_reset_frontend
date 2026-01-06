import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { IndexPath } from '@ui-kitten/components';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../auth';
import { IncidentService } from '@/shared/services/Incident';
import { StructureService, ChildStructure } from '@/shared/services/Structure';

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
    selectedTypeIndex: IndexPath | IndexPath[];
    selectedAgencyIndex: IndexPath | IndexPath[];

    // Form states
    description: string;
    isSubmitted: boolean;
    isSubmitting: boolean;

    // Computed display values
    displayType: string;
    displayAgency: string;

    // Context values
    drawName?: string;
    agencies: ChildStructure[];
    loadingAgencies: boolean;
}

export interface ReportsFormActions {
    setSelectedTypeIndex: (index: IndexPath | IndexPath[]) => void;
    setSelectedAgencyIndex: (index: IndexPath | IndexPath[]) => void;
    setDescription: (description: string) => void;
    handleSubmit: () => Promise<void>;
    resetForm: () => void;
}

export function useReportsForm(): ReportsFormState & ReportsFormActions {
    const router = useRouter();
    const params = useLocalSearchParams<{ drawId: string; drawName: string; agencyName: string; agencyId: string }>();
    const { user } = useAuth();

    // Selection states
    const [selectedTypeIndex, setSelectedTypeIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));
    const [selectedAgencyIndex, setSelectedAgencyIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));

    // Data states
    const [agencies, setAgencies] = useState<ChildStructure[]>([]);
    const [loadingAgencies, setLoadingAgencies] = useState(false);

    // Form states
    const [description, setDescription] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Computed display values
    const displayType = INCIDENT_TYPES[(selectedTypeIndex as IndexPath).row].title;
    const selectedAgency = agencies.length > 0 ? agencies[(selectedAgencyIndex as IndexPath).row] : null;
    const displayAgency = selectedAgency ? selectedAgency.name : 'Seleccionar Agencia';

    // Fetch agencies
    useEffect(() => {
        const fetchAgencies = async () => {
            if (!user?.structure?.id) return;

            try {
                setLoadingAgencies(true);
                const children = await StructureService.getChildren(Number(user.structure.id));
                setAgencies(children);

                // Pre-select agency if provided in params
                if (params.agencyId && children.length > 0) {
                    const index = children.findIndex(c => c.id.toString() === params.agencyId);
                    if (index !== -1) {
                        setSelectedAgencyIndex(new IndexPath(index));
                    }
                }
            } catch (error) {
                console.error('Error fetching agencies:', error);
                Alert.alert('Error', 'No se pudieron cargar las agencias.');
            } finally {
                setLoadingAgencies(false);
            }
        };

        fetchAgencies();
    }, [user?.structure?.id, params.agencyId]);

    const handleSubmit = async () => {
        // Basic validation
        if (!description.trim()) {
            Alert.alert('Incompleto', 'Por favor, ingresa una descripción de la incidencia.');
            return;
        }

        if (!user?.structure?.id) {
            Alert.alert('Error', 'No se pudo identificar la estructura del banco.');
            return;
        }

        if (!selectedAgency) {
            Alert.alert('Incompleto', 'Por favor, selecciona una agencia.');
            return;
        }

        try {
            setIsSubmitting(true);

            await IncidentService.create({
                structure: Number(selectedAgency.id),
                draw: params.drawId ? parseInt(params.drawId, 10) : null,
                incident_type: displayType,
                description,
            });

            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting incident:', error);
            Alert.alert('Error', 'No se pudo enviar el reporte. Por favor, intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedTypeIndex(new IndexPath(0));
        // Reset agency to default or keep? Let's reset to first if available
        if (agencies.length > 0) setSelectedAgencyIndex(new IndexPath(0));
        setDescription('');
        setIsSubmitted(false);
        setIsSubmitting(false);
    };

    return {
        // State
        selectedTypeIndex,
        selectedAgencyIndex,
        description,
        isSubmitted,
        isSubmitting,
        displayType,
        displayAgency,
        drawName: params.drawName,
        agencies,
        loadingAgencies,

        // Actions
        setSelectedTypeIndex,
        setSelectedAgencyIndex,
        setDescription,
        handleSubmit,
        resetForm,
    };
}

export { INCIDENT_TYPES };
