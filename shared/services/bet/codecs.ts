import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

const StringOrNumber = t.union([t.string, t.number]);

const DrawDetailsCodec = t.intersection([
    t.type({
        id: StringOrNumber,
        name: t.string
    }),
    t.partial({
        description: t.string
    })
]);

const GameTypeDetailsCodec = t.type({
    id: StringOrNumber,
    name: t.string
});

const BetTypeDetailsCodec = t.intersection([
    t.type({
        id: StringOrNumber,
        name: t.string
    }),
    t.partial({
        code: t.string
    })
]);

export const BackendBetCodec = t.intersection([
    t.type({
        id: StringOrNumber,
        draw: StringOrNumber,
        numbers_played: t.unknown,
        amount: StringOrNumber,
        created_at: t.string
    }),
    t.partial({
        is_winner: t.boolean,
        payout_amount: StringOrNumber,
        owner_structure: StringOrNumber,
        game_type: StringOrNumber,
        bet_type: StringOrNumber,
        receipt_code: t.string,
        draw_details: DrawDetailsCodec,
        game_type_details: GameTypeDetailsCodec,
        bet_type_details: BetTypeDetailsCodec
    })
]);

export const BackendBetArrayCodec = t.array(BackendBetCodec);
export const BackendBetOrArrayCodec = t.union([BackendBetCodec, BackendBetArrayCodec]);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    console.warn(`[BetApi] ${label} decode failed:`, PathReporter.report(result).join('; '));
    return value as T;
};
