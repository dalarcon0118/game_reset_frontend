import { AuthModel, AuthStatus, PersistStatus, Tokens, User } from './model';
import { AuthMsg } from './msg';
import { Return, singleton, ret } from '../../core/tea-utils/return';
import { Cmd } from '../../core/tea-utils/cmd';
import { RemoteDataHttp } from '../../core/tea-utils/remote.data.http';
import { AuthRepository } from '../../repositories/auth';

export function update(model: AuthModel, msg: AuthMsg): Return<AuthModel, AuthMsg> {
    switch (msg.type) {
        case 'BOOTSTRAP_STARTED':
            return ret(
                { ...model, status: AuthStatus.HYDRATING },
                RemoteDataHttp.fetch(
                    async () => {
                        const { access, refresh } = await AuthRepository.getToken();
                        if (access && refresh) return { access, refresh } as Tokens;
                        return null;
                    },
                    (tokens) => ({ type: 'TOKENS_HYDRATED', tokens: tokens.type === 'Success' ? tokens.data : null }),
                    'HYDRATE_TOKENS'
                )
            );

        case 'TOKENS_HYDRATED':
            if (msg.tokens) {
                return singleton({
                    ...model,
                    status: AuthStatus.AUTHENTICATED,
                    tokens: msg.tokens,
                });
            }
            return singleton({
                ...model,
                status: AuthStatus.ANONYMOUS,
            });

        case 'LOGIN_SUCCEEDED':
            return ret(
                {
                    ...model,
                    status: AuthStatus.AUTHENTICATED,
                    persistStatus: PersistStatus.SAVING,
                    tokens: msg.tokens,
                    user: msg.user,
                },
                RemoteDataHttp.fetch(
                    () => AuthRepository.saveToken(msg.tokens.access, msg.tokens.refresh),
                    (result) => result.type === 'Success'
                        ? { type: 'PERSIST_TOKENS_COMPLETED' }
                        : { type: 'PERSIST_TOKENS_FAILED', error: result.type === 'Failure' ? result.error : 'Unknown error' },
                    'PERSIST_TOKENS'
                )
            );

        case 'PERSIST_TOKENS_COMPLETED':
            return singleton({ ...model, persistStatus: PersistStatus.SUCCESS });

        case 'PERSIST_TOKENS_FAILED':
            return singleton({ ...model, persistStatus: PersistStatus.FAILURE, error: 'Failed to persist tokens' });

        case 'REFRESH_REQUESTED':
            if (model.status === AuthStatus.REFRESHING || !model.tokens?.refresh) {
                return singleton(model);
            }
            return ret(
                { ...model, status: AuthStatus.REFRESHING },
                RemoteDataHttp.fetch(
                    async () => {
                        // Aquí iría la llamada real al API de refresh vía AuthRepository o ApiClient
                        // Por ahora simulamos con el repositorio si tuviera refresh (que no veo explícito)
                        throw new Error('Refresh not implemented in repository yet');
                    },
                    (result) => result.type === 'Success'
                        ? { type: 'REFRESH_SUCCEEDED', tokens: result.data }
                        : { type: 'REFRESH_FAILED', error: result.type === 'Failure' ? String(result.error) : 'Unknown error' },
                    'REFRESH_TOKENS'
                )
            );

        case 'REFRESH_SUCCEEDED':
            return ret(
                {
                    ...model,
                    status: AuthStatus.AUTHENTICATED,
                    tokens: msg.tokens,
                    persistStatus: PersistStatus.SAVING
                },
                RemoteDataHttp.fetch(
                    () => AuthRepository.saveToken(msg.tokens.access, msg.tokens.refresh),
                    (result) => result.type === 'Success'
                        ? { type: 'PERSIST_TOKENS_COMPLETED' }
                        : { type: 'PERSIST_TOKENS_FAILED', error: result.type === 'Failure' ? result.error : 'Unknown error' },
                    'PERSIST_TOKENS'
                )
            );

        case 'REFRESH_FAILED':
            return ret(
                { ...model, status: AuthStatus.EXPIRED, tokens: null, user: null },
                Cmd.batch([
                    RemoteDataHttp.fetch(
                        () => AuthRepository.clearToken(),
                        () => ({ type: 'CLEAR_TOKENS_COMPLETED' }),
                        'CLEAR_TOKENS'
                    ),
                    Cmd.navigate('/login')
                ])
            );

        case 'AUTH_ERROR_DETECTED':
            if (msg.status === 401 && model.tokens?.refresh) {
                return update(model, { type: 'REFRESH_REQUESTED' });
            }
            return update(model, { type: 'SESSION_EXPIRED' });

        case 'SESSION_EXPIRED':
            return ret(
                { ...model, status: AuthStatus.EXPIRED, tokens: null, user: null },
                Cmd.batch([
                    RemoteDataHttp.fetch(
                        () => AuthRepository.clearToken(),
                        () => ({ type: 'CLEAR_TOKENS_COMPLETED' }),
                        'CLEAR_TOKENS'
                    ),
                    Cmd.navigate('/login')
                ])
            );

        case 'LOGOUT_REQUESTED':
            return ret(
                { ...model, status: AuthStatus.LOGGING_OUT },
                RemoteDataHttp.fetch(
                    () => AuthRepository.logout(),
                    () => ({ type: 'LOGOUT_COMPLETED' }),
                    'PERFORM_LOGOUT'
                )
            );

        case 'LOGOUT_COMPLETED':
            return ret(
                { ...model, status: AuthStatus.ANONYMOUS, tokens: null, user: null },
                Cmd.batch([
                    RemoteDataHttp.fetch(
                        () => AuthRepository.clearToken(),
                        () => ({ type: 'CLEAR_TOKENS_COMPLETED' }),
                        'CLEAR_TOKENS'
                    ),
                    Cmd.navigate('/login')
                ])
            );

        case 'CLEAR_TOKENS_COMPLETED':
            return singleton({ ...model, persistStatus: PersistStatus.IDLE });

        default:
            return singleton(model);
    }
}
