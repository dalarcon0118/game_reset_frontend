
import { Cmd, CommandDescriptor } from './cmd';

/**
 * Normalizes a Cmd into a flat array of CommandDescriptors.
 */
function normalizeCmd(cmd: Cmd): CommandDescriptor[] {
    if (!cmd) return [];
    if (Array.isArray(cmd)) return cmd;
    return [cmd];
}

/**
 * Return class mimicking Elm's Return pattern (Model, Cmd Msg).
 * https://package.elm-lang.org/packages/bloom/elm-return/latest/Return
 */
export class Return<Model, Msg> {
    constructor(public model: Model, public cmd: Cmd) { }

    /**
     * Create a Return with a model and no commands.
     */
    static singleton<M>(model: M): Return<M, any> {
        return new Return(model, Cmd.none);
    }

    /**
     * Create a Return with a model and a command.
     * Equivalent to `return` in the Elm package (but allow avoiding keyword).
     */
    static val<M, Msg>(model: M, cmd: Cmd): Return<M, Msg> {
        return new Return(model, cmd);
    }

    /**
     * Map the model.
     * Update the model part of the Return.
     */
    map<NewModel>(f: (model: Model) => NewModel): Return<NewModel, Msg> {
        return new Return(f(this.model), this.cmd);
    }

    /**
     * Map the command.
     * Note: In this TypeScript implementation, Cmd descriptors are often loosely typed or 'any'.
     * If you have a way to wrap messages in your command system (e.g. wrapper function in payload),
     * you can implement it here.
     * 
     * For now, this assumes the command structure might need a `msgCreator` transformation 
     * or simply returns the same commands if they are global.
     * 
     * If your Cmd system relies on msg creators (like in `Cmd.http`), we might not be able to 
     * generically "map" the resulting message type without changing the command payload structure.
     * 
     * However, to support `andMapCmd` logic where we merge commands, we just pass through for now
     * unless a specific mapping logic is provided.
     */
    mapCmd<NewMsg>(f: (msg: Msg) => NewMsg): Return<Model, NewMsg> {
        // In a strict Elm architecture, we would map the effect to produce NewMsg.
        // As `Cmd` here is data, we assume the caller handles the command transformation logic 
        // or that this is just for type alignment in the chain.
        // Realistically, to wrap the message, we'd need to modify the command descriptor's `msgCreator`.

        // Detailed implementation depends on how `Cmd` consumes messages. 
        // For this "Return" pattern helper, we'll cast the type, 
        // assuming the commands are compatible or modified externally.
        return new Return(this.model, this.cmd) as unknown as Return<Model, NewMsg>;
    }

    /**
     * Combine with another Return, mapping its command.
     * Used for composing updates from child components.
     * 
     * Usage:
     * singleton(ModelConstructor)
     *  .andMapCmd(MsgWrapper, subComponentReturn)
     * 
     * Reference:
     * singleton Model
     *  |> andMapCmd MsgForVehicleTable (VehicleTableAction.update msg model.vehicleTableModel)
     */
    andMapCmd<SubModel, SubMsg>(
        msgWrapper: (subMsg: SubMsg) => Msg,
        subReturn: Return<SubModel, SubMsg>
    ): Return<any, Msg> {
        // 1. Apply the model function.
        // We assume `this.model` is a function expecting `subReturn.model`.
        const currentModelFn = this.model as unknown as (sub: SubModel) => any;
        const newModel = currentModelFn(subReturn.model);

        // 2. Map the sub-commands using the wrapper.
        // We assume commands are objects that might have a `msgCreator` or equivalent, 
        // OR we just collect them. 
        // The user example implies we just want to collect commands from the sub-module.
        // If we strictly need to wrap the message, we would visit the commands.
        // Example: if command has `msgCreator`, we compose it with `msgWrapper`.

        const subCmds = normalizeCmd(subReturn.cmd).map(cmd => {
            // Attempt to wrap the message creator if it exists (e.g. for HTTP or Task)
            if (cmd.payload && typeof cmd.payload.msgCreator === 'function') {
                const originalCreator = cmd.payload.msgCreator;
                return {
                    ...cmd,
                    payload: {
                        ...cmd.payload,
                        msgCreator: (data: any) => msgWrapper(originalCreator(data))
                    }
                };
            }
            // If it's a sleep command or similar with direct 'msg'
            if (cmd.payload && cmd.payload.msg) {
                return {
                    ...cmd,
                    payload: {
                        ...cmd.payload,
                        msg: msgWrapper(cmd.payload.msg)
                    }
                };
            }

            // For other commands, we return as is or warn if mapping is not possible?
            // Depending on the architecture, we might just append them.
            return cmd;
        });

        const currentCmds = normalizeCmd(this.cmd);
        const combinedCmds = [...currentCmds, ...subCmds];

        return new Return(newModel, combinedCmds);
    }
}

/**
 * Functional helpers to match Elm style:
 * return model (cmd)
 */
export function ret<M, Msg>(model: M, cmd: Cmd): Return<M, Msg> {
    return new Return(model, cmd);
}

export function singleton<M>(model: M): Return<M, any> {
    return Return.singleton(model);
}
