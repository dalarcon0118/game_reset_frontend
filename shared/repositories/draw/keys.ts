/**
 * DrawKeys - Utilidades para llaves de caché del repositorio de sorteos
 */
export const DrawKeys = {
    /** Llave raíz para la lista de últimos sorteos */
    lastDraws: () => '@last_draws',

    /** Llave para tipos de apuesta por sorteo */
    betTypes: (drawId: string | number) => `@bet_types:${drawId}`,
    
    /** Llave para un sorteo individual */
    draw: (id: string | number) => `@draw:${id}`
};
