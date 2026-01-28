import { Return, singleton } from '../../../shared/core/return';
import { Cmd } from '../../../shared/core/cmd';

describe('Return andMapCmd', () => {
    it('should recursively wrap messages in nested command arrays', () => {
        // 1. Setup nested commands
        const taskCmd = Cmd.task({
            task: async () => 'data',
            onSuccess: (data) => ({ type: 'SUCCESS', data }),
            onFailure: (err) => ({ type: 'FAILURE', err })
        });

        // Nested array structure like [ [task] ]
        const nestedCmds = [ [ taskCmd ] ];

        const subReturn = new Return({ value: 1 }, nestedCmds as any);

        // 2. Wrap using andMapCmd
        const makeModel = (sub: { value: number }) => ({ sub });
        const globalReturn = singleton(makeModel).andMapCmd(
            (subMsg: any) => ({ type: 'WRAPPER', payload: subMsg }),
            subReturn
        );

        // 3. Verify normalization and wrapping
        const flattenedCmds = globalReturn.cmd as any[];
        expect(flattenedCmds).toHaveLength(1);
        
        const wrappedCmd = flattenedCmds[0];
        expect(wrappedCmd.type).toBe('TASK');
        
        // Verify onSuccess is wrapped
        const successMsg = wrappedCmd.payload.onSuccess('test-data');
        expect(successMsg).toEqual({
            type: 'WRAPPER',
            payload: { type: 'SUCCESS', data: 'test-data' }
        });
    });
});
