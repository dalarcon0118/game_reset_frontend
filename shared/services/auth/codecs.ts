import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

export const BackendUserCodec = t.type({
  id: t.union([t.string, t.number]),
  username: t.string,
  // Add more user fields as per @/data/mock_data User type if needed
});

export const BackendLoginResponseCodec = t.intersection([
  t.type({
    access: t.string,
    user: t.unknown, // Keeping it simple for now as User is mock data based
  }),
  t.partial({
    refresh: t.string,
  })
]);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
  const result = codec.decode(value);
  if (isRight(result)) return result.right;
  console.warn(`[AuthApi] ${label} decode failed:`, PathReporter.report(result).join('; '));
  return value as T;
};
