import { logger } from '../../utils/logger';

const log = logger.withTag('TASK_EFFECT');

export interface TaskPayload {
  task: (...args: any[]) => Promise<any>;
  args?: any[];
  onSuccess: (data: any) => any;
  onFailure: (error: any) => any;
  label?: string; // Optional label for debugging
}

export async function handleTask(payload: TaskPayload, dispatch: (cmd: any) => void) {
  if (!payload) {
    log.error('Task execution failed - missing payload');
    return;
  }
  const { task, args, onSuccess, onFailure, label } = payload;

  const taskName = label || task.name || 'Anonymous Task';

  // Validate that task is a function before calling it
  if (typeof task !== 'function') {
    const error = new Error(`Task execution failed: Expected function, got ${typeof task} (Task: ${taskName})`);
    log.error('Task execution failed - invalid task function', error, { task, args, label });
    dispatch(onFailure(error));
    return;
  }

  try {
    log.debug(`Executing Task: ${taskName}`, { args });
    log.debug(`[TASK_EFFECT] Calling task function`, { taskType: typeof task, taskName });
    const result = await task(...(args || []));
    log.debug(`[TASK_EFFECT] Task returned`, { taskName, hasResult: result !== undefined, resultType: typeof result });
    const msg = onSuccess(result);
    if (msg) {
      dispatch(msg);
    } else {
      log.debug(`Task ${taskName} completed without message (onSuccess returned null)`);
    }
  } catch (error) {
    log.error(`Task execution failed: ${taskName}`, error, {
      args,
      label,
      taskSource: task.toString().substring(0, 100) // Log first 100 chars of task source for identification
    });
    const msg = onFailure(error);
    if (msg) {
      dispatch(msg);
    }
  }
}
