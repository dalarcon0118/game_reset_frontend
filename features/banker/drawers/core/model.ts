import { WebData } from '@core/tea-utils';
import { ListeroDetails, ListeroDrawDetail } from '@/shared/services/structure/types';
import { GameRegistry } from '@/shared/core/registry/game_registry';
import { TimePolicy } from '@/shared/repositories/system/time/time.update';

export interface Model {
    id: number | null;
    selectedDate: Date;
    details: WebData<ListeroDetails>;
    filters: {
        status: string | null;
        drawType: string | null;
    };
}

// Selectors
export function selectDetails(model: Model) { return model.details; }
export function selectSelectedDate(model: Model) { return model.selectedDate; }
export function selectIsLoading(model: Model) { return model.details.type === 'Loading'; }
export function selectDetailsData(model: Model) {
    return model.details.type === 'Success' ? model.details.data : null;
}
export function selectError(model: Model) {
    return model.details.type === 'Failure' ? model.details.error : null;
}

// Semantic Selectors for View
export function selectFormattedDate(model: Model) {
    return TimePolicy.formatDisplayDate(model.selectedDate);
}

export function selectApiDate(model: Model) {
    return TimePolicy.formatLocalDate(model.selectedDate);
}

export function selectEmptyMessage(model: Model) {
    return `No hay sorteos para mostrar el ${selectFormattedDate(model)}.`;
}

// 🎭 VIEW MODEL SELECTOR
export const selectDrawersViewModel = (model: Model) => {
    const details = selectDetailsData(model);
    const rawDraws: ListeroDrawDetail[] = details?.draws || [];

    // 1. Clasificación Robusta (Una sola pasada con Fallbacks)
    const classifiedDraws = rawDraws.map(draw => {
        const category = GameRegistry.getCategoryByDraw({ 
            code: draw.draw_type_code, 
            name: draw.draw_name 
        }) || 'other'; // Fallback a 'other' si el registro no lo reconoce
        
        const label = category === 'loteria' ? 'LOTERÍA' : 
                     category === 'bolita' ? 'BOLITA' : 'OTROS';
        
        return { ...draw, category, label };
    });

    // 2. Metadata para Filtros (Unicidad Garantizada)
    const availableStatuses = Array.from(new Set(rawDraws.map(d => d.status)))
        .sort()
        .map(status => ({ 
            id: status, 
            label: status.toUpperCase() 
        }));
    
    const categoriesMap = new Map<string, string>();
    classifiedDraws.forEach(d => categoriesMap.set(d.category, d.label));
    
    const availableTypes = Array.from(categoriesMap.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label));

    // 3. Aplicar filtros
    const filteredDraws = classifiedDraws.filter(d => {
        const matchesStatus = !model.filters.status || d.status === model.filters.status;
        const matchesType = !model.filters.drawType || d.category === model.filters.drawType;
        return matchesStatus && matchesType;
    });

    // 4. Agrupar sorteos (Seguro contra undefined)
    const groupedDraws = filteredDraws.reduce((acc, draw) => {
        const groupName = (draw.label || 'OTROS').toUpperCase();
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(draw);
        return acc;
    }, {} as Record<string, ListeroDrawDetail[]>);

    return {
        title: `Sorteo ${details?.listero_name || ''}`,
        detailsData: details,
        detailsState: model.details,
        selectedDate: model.selectedDate,
        emptyMessage: selectEmptyMessage(model),
        hasDraws: rawDraws.length > 0,
        hasFilteredDraws: filteredDraws.length > 0,
        groupedDraws,
        availableStatuses,
        availableTypes,
        currentStatusFilter: model.filters.status,
        currentTypeFilter: model.filters.drawType,
    };
};