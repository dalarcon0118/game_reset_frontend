import { useListeriasStore } from '../core/store';
import { 
    INIT_SCREEN, 
    REFRESH_CLICKED, 
    NAVIGATE_BACK, 
    LISTERIA_SELECTED, 
    RULES_PRESSED 
} from '../core/msg';

interface UseListeriasProps {
    id: number;
}

export const useListerias = ({ id }: UseListeriasProps) => {
    const model = useListeriasStore((state) => state.model);
    const dispatch = useListeriasStore((state) => state.dispatch);

    return {
        listerias: model.listerias.type === 'Success' ? model.listerias.data : [],
        loading: model.listerias.type === 'Loading',
        error: model.listerias.type === 'Failure' ? model.listerias.error : null,
        refresh: () => dispatch(REFRESH_CLICKED()),
        handleBack: () => dispatch(NAVIGATE_BACK()),
        handleListeriaSelected: (listeriaId: number, name: string) => 
            dispatch(LISTERIA_SELECTED(listeriaId, name)),
        handleRulesPressed: (listeriaId: number) => 
            dispatch(RULES_PRESSED(listeriaId)),
        init: () => dispatch(INIT_SCREEN(id))
    };
};
