// Types for Seed Generator feature
export interface SeedData {
    roles: any[];
    structures: any[];
    users: any[];
    drawTypes: any[];
    rules: any[];
    draws: any[];
}

export interface GeneratedScript {
    content: string;
    filename: string;
    timestamp: string;
}

export interface Model {
    seedData: SeedData;
    generatedScript: GeneratedScript | null;
    loading: boolean;
    error: string | null;
    isPreviewModalOpen: boolean;
    selectedDataTypes: string[];
    availableDataTypes: string[];
}

export type Msg =
    | { type: 'FETCH_SEED_DATA_START' }
    | { type: 'FETCH_SEED_DATA_SUCCESS'; payload: SeedData }
    | { type: 'FETCH_SEED_DATA_ERROR'; payload: string }
    | { type: 'GENERATE_SCRIPT_START'; payload: { dataTypes: string[] } }
    | { type: 'GENERATE_SCRIPT_SUCCESS'; payload: GeneratedScript }
    | { type: 'GENERATE_SCRIPT_ERROR'; payload: string }
    | { type: 'DOWNLOAD_SCRIPT' }
    | { type: 'TOGGLE_DATA_TYPE'; payload: string }
    | { type: 'OPEN_PREVIEW_MODAL' }
    | { type: 'CLOSE_PREVIEW_MODAL' }
    | { type: 'RESET_GENERATOR' };

export const initialSeedGeneratorState: Model = {
    seedData: {
        roles: [],
        structures: [],
        users: [],
        drawTypes: [],
        rules: [],
        draws: [],
    },
    generatedScript: null,
    loading: false,
    error: null,
    isPreviewModalOpen: false,
    selectedDataTypes: ['roles', 'structures', 'users', 'drawTypes', 'rules', 'draws'],
    availableDataTypes: ['roles', 'structures', 'users', 'drawTypes', 'rules', 'draws'],
};
