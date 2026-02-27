import { Model as ParletSession, initialParletState } from '../parlet/parlet.types';
import { Model as CentenaSession, initialCentenaState } from '../centena/centena.types';
import { EditModel as EditSession, initialEditState } from './edit.types';
import { ParletBet, CentenaBet, FijosCorridosBet } from '@/types';
import { WebData, RemoteData } from '@/shared/core/remote.data';

export interface BolitaListData {
    parlets: ParletBet[];
    centenas: CentenaBet[];
    fijosCorridos: FijosCorridosBet[];
}

export interface BolitaListState {
    remoteData: WebData<BolitaListData>;
    aliasFilter: string;
    isRefreshing: boolean;
    loadedDrawId: string | null;
}

export const initialBolitaListState: BolitaListState = {
    remoteData: RemoteData.notAsked(),
    aliasFilter: '',
    isRefreshing: false,
    loadedDrawId: null,
};

export const initialBolitaListData: BolitaListData = {
    parlets: [],
    centenas: [],
    fijosCorridos: [],
};

export interface BolitaModel {
    // Core state
    isEditing: boolean;
    currentDrawId: string | null;

    // Sub-feature sessions
    parletSession: ParletSession;
    centenaSession: CentenaSession;
    editState: EditSession;

    // Data sessions
    listState: BolitaListState;
    entrySession: BolitaListData;

    // Summary (internalized)
    summary: {
        fijosCorridosTotal: number;
        parletsTotal: number;
        centenasTotal: number;
        grandTotal: number;
        hasBets: boolean;
        isSaving: boolean;
    };
}

export const initialModel: BolitaModel = {
    isEditing: false,
    currentDrawId: null,
    parletSession: initialParletState,
    centenaSession: initialCentenaState,
    editState: initialEditState,
    listState: initialBolitaListState,
    entrySession: initialBolitaListData,
    summary: {
        fijosCorridosTotal: 0,
        parletsTotal: 0,
        centenasTotal: 0,
        grandTotal: 0,
        hasBets: false,
        isSaving: false,
    },
};
