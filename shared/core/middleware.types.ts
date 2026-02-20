import * as t from 'io-ts';
import { Cmd } from './cmd';

// Custom codec for Function type since io-ts doesn't provide one out of the box
const FunctionType = new t.Type<Function, Function, unknown>(
  'Function',
  (u): u is Function => typeof u === 'function',
  (u, c) => (typeof u === 'function' ? t.success(u) : t.failure(u, c)),
  (a) => a
);

export const TeaMiddlewareCodec = t.exact(t.partial({
  id: t.string,
  init: FunctionType,
  beforeUpdate: FunctionType,
  afterUpdate: FunctionType,
  onUpdateError: FunctionType,
}));

export interface TeaMiddleware<TModel, TMsg> {
  id?: string;
  init?: (dispatch: (msg: TMsg) => void) => void;
  beforeUpdate?: (model: TModel, msg: TMsg) => void;
  afterUpdate?: (prevModel: TModel, msg: TMsg, nextModel: TModel, cmd: Cmd) => void;
  onUpdateError?: (model: TModel, msg: TMsg, error: any) => void;
}

