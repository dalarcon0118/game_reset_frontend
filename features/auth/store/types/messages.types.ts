export enum AuthMsgType {
  LOAD_SAVED_USERNAME_REQUESTED = 'LOAD_SAVED_USERNAME_REQUESTED',
  CHECK_AUTH_STATUS_REQUESTED = 'CHECK_AUTH_STATUS_REQUESTED',
  LOGIN_REQUESTED = 'LOGIN_REQUESTED',
  LOGOUT_REQUESTED = 'LOGOUT_REQUESTED',
}

export type AuthMsg =
  | { type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED }
  | { type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }
  | { type: AuthMsgType.LOGIN_REQUESTED; username: string; pin: string }
  | { type: AuthMsgType.LOGOUT_REQUESTED };

export type AuthMsgType = keyof typeof AuthMsgType;