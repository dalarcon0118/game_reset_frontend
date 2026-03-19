export interface IDeviceRepository {
    /**
     * Recupera el ID único del dispositivo o genera uno nuevo si no existe.
     * El ID se persiste en el almacenamiento seguro (Keychain/Keystore).
     */
    getUniqueId(): Promise<string>;

    /**
     * Resetea la identidad del dispositivo (solo para propósitos de soporte/debug).
     */
    resetIdentity(): Promise<void>;
}
