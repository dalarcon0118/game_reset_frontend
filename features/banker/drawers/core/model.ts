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

type DrawWithCategory = ListeroDrawDetail & {
    category: string;
    label: string;
};

function classifyDraw(draw: ListeroDrawDetail): DrawWithCategory {
    const category = GameRegistry.getCategoryByDraw({
        code: draw.draw_type_code,
        name: draw.draw_name
    }) || 'other';

    const label = category === 'loteria' ? 'LOTERÍA' :
        category === 'bolita' ? 'BOLITA' : 'OTROS';

    return { ...draw, category, label };
}

function* iterateClassifiedDraws(draws: readonly ListeroDrawDetail[]): Generator<DrawWithCategory, void, unknown> {
    for (const draw of draws) {
        yield classifyDraw(draw);
    }
}

// 🎭 VIEW MODEL SELECTOR
export const selectDrawersViewModel = (model: Model) => {
    const details = selectDetailsData(model);
    const rawDraws: ListeroDrawDetail[] = details?.draws || [];
    const statuses = new Set<string>();
    const categoriesMap = new Map<string, string>();
    const groupedDraws: Record<string, ListeroDrawDetail[]> = {};
    let filteredCount = 0;

    for (const draw of iterateClassifiedDraws(rawDraws)) {
        statuses.add(draw.status);
        categoriesMap.set(draw.category, draw.label);

        const matchesStatus = !model.filters.status || draw.status === model.filters.status;
        const matchesType = !model.filters.drawType || draw.category === model.filters.drawType;
        if (!matchesStatus || !matchesType) continue;

        filteredCount++;
        const groupName = (draw.label || 'OTROS').toUpperCase();
        if (!groupedDraws[groupName]) {
            groupedDraws[groupName] = [];
        }
        groupedDraws[groupName].push(draw);
    }

    const availableStatuses = Array.from(statuses)
        .sort()
        .map(status => ({
            id: status,
            label: status.toUpperCase()
        }));

    const availableTypes = Array.from(categoriesMap.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return {
        title: `Sorteo ${details?.listero_name || ''}`,
        detailsData: details,
        detailsState: model.details,
        selectedDate: model.selectedDate,
        emptyMessage: selectEmptyMessage(model),
        hasDraws: rawDraws.length > 0,
        hasFilteredDraws: filteredCount > 0,
        groupedDraws,
        availableStatuses,
        availableTypes,
        currentStatusFilter: model.filters.status,
        currentTypeFilter: model.filters.drawType,
    };
};
