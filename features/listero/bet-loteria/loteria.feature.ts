import { Feature, FeatureAdapter } from '@core/architecture/interfaces';
import { LoteriaFeatureModel, FeatureMsg } from './core/feature.types';
import { updateFeature } from './core/feature.update';
import { initialModel } from './core/store';

const LoteriaAdapter: FeatureAdapter<FeatureMsg, any> = {
    lift: (msg: FeatureMsg) => ({ type: 'LOTERIA_FEATURE', payload: msg }),
    lower: (msg: any): FeatureMsg | null => {
        if (msg.type === 'LOTERIA_FEATURE') return msg.payload;
        if (msg.type === 'LOTERIA' || msg.type === 'LIST' || msg.type === 'MANAGEMENT' || msg.type === 'CORE') {
            return msg as FeatureMsg;
        }
        return null;
    }
};

export const LoteriaFeature: Feature<LoteriaFeatureModel, FeatureMsg> = {
    id: 'LOTERIA',
    adapter: LoteriaAdapter,
    init: () => [initialModel as LoteriaFeatureModel, null],
    update: (msg, state) => updateFeature(state, msg) as any
};

export { LoteriaFeatureModel, FeatureMsg } from './core/feature.types';
export { updateFeature } from './core/feature.update';
export { initialModel } from './core/store';