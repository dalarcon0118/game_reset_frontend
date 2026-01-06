import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { BankerDashboardService, DashboardSummary } from '../services/BankerDashboardService';
import { ChildStructure, StructureService } from '@/shared/services/Structure';
import { useAuth } from '../../auth';
import * as config from '@/config';

interface UseBankerDashboardResult {
    isLoading: boolean;
    agencies: ChildStructure[] | null;
    summary: DashboardSummary | null;
    refresh: () => Promise<void>;
    onSelected: (id: number) => void;
    onRulesPress: (id: number) => void;
    onListPress: (id: number) => void;
}

export const useBankerDashboard = (): UseBankerDashboardResult => {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [agencies, setAgencies] = useState<ChildStructure[] | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);

    const onSelected = (id: number) => {
        router.push({ pathname: config.routes.routes.banker.drawer.screen, params: { id } });
    };
    const onRulesPress = (id: number) => {
        router.push({ pathname: config.routes.routes.banker.rules.screen, params: { id_structure: id } });
    }
    const onListPress = (id: number) => {
        router.push({ pathname: config.routes.routes.banker.listerias.screen, params: { id } });
    }

    const fetchData = useCallback(async () => {
        if (!user?.structure?.id) return;

        try {
            setIsLoading(true);
            const data = await BankerDashboardService.getDashboardData(Number(user.structure.id));
            setAgencies(data.children);
            setSummary(data.summary);
        } catch (error) {
            console.error('Error fetching banker dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.structure?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = async () => {
        await fetchData();
    };

    return {
        isLoading,
        agencies,
        summary,
        refresh,
        onSelected,
        onRulesPress,
        onListPress
    };
};
