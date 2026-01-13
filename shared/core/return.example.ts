import { Return, singleton } from './return';
import { Cmd } from './cmd';

// --- Mock Types & Actions for Demonstration ---
interface VehicleTableModel { count: number }
interface FilterModel { query: string }

interface Model {
    vehicleTableModel: VehicleTableModel;
    filterModel: FilterModel;
}

type Msg
    = { type: 'VisibilityState' }
    | { type: 'MsgForFilter', payload: any }
    | { type: 'MsgForVehicleTable', payload: any };

const VehicleTableAction = {
    update: (_msg: any, model: VehicleTableModel) => Return.singleton(model)
};

const FilterAction = {
    update: (_msg: any, model: FilterModel) => Return.singleton(model)
};

// --- Usage Implementation ---

/**
 * Curried constructor helper.
 * Required because `singleton(Constructor)` in Elm assumes partial application,
 * but in JS/TS functions are not auto-curried.
 */
const makeModel = (vt: VehicleTableModel) => (fm: FilterModel): Model => ({
    vehicleTableModel: vt,
    filterModel: fm
});

export function update(msg: Msg, model: Model): Return<Model, Msg> {
    switch (msg.type) {
        case 'VisibilityState':
            // return model (timeout 0 (MsgForFilter ...))
            return Return.val(
                model,
                Cmd.sleep(0, { type: 'MsgForFilter', payload: 'FilterType.VisibilityState' })
            );

        case 'MsgForFilter':
            if (msg.payload === 'SearchInfo') {
                const mdl = {
                    ...model,
                    vehicleTableModel: { ...model.vehicleTableModel, count: 0 } // example update
                };
                return Return.val(
                    mdl,
                    Cmd.sleep(0, { type: 'MsgForVehicleTable', payload: 'ResetRequest' })
                );
            }
            break;
    }

    /* 
       Equivalent to:
       singleton Model
           |> andMapCmd MsgForVehicleTable (VehicleTableAction.update msg model.vehicleTableModel)
           |> andMapCmd MsgForFilter (FilterAction.update msg model.filterModel)
    */
    return singleton(makeModel)
        .andMapCmd(
            (subMsg) => ({ type: 'MsgForVehicleTable', payload: subMsg }), // Msg wrapper
            VehicleTableAction.update(msg, model.vehicleTableModel)
        )
        .andMapCmd(
            (subMsg) => ({ type: 'MsgForFilter', payload: subMsg }),       // Msg wrapper
            FilterAction.update(msg, model.filterModel)
        );
}
