/**
 * Utility for creating type-safe TEA messages.
 */

export type MsgWithPayload<T extends string, P> = {
  readonly type: T;
  readonly payload: P;
};

export type MsgCreator<T extends string, P = void> = {
  (payload: P): MsgWithPayload<T, P>;
  type(): { type: T };
  readonly kind: T;
  _type: MsgWithPayload<T, P>;
  toString(): T;
};

export function createMsg<T extends string>(type: T): MsgCreator<T, void>;
export function createMsg<T extends string, P>(type: T): MsgCreator<T, P>;
export function createMsg<T extends string, P = void>(type: T): any {
  const creator = (payload: P) => ({ type, payload });
  (creator as any).type = () => ({ type });
  (creator as any).kind = type;
  (creator as any)._type = { type, payload: undefined as P };
  (creator as any).toString = () => type;
  return creator;
}
