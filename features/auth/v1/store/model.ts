export interface LoginModel {
    username: string;
    pin: string;
    isEditingUsername: boolean;
}

export const initialModel: LoginModel = {
    username: '',
    pin: '',
    isEditingUsername: false,
};
