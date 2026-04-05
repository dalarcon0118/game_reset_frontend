// Un mini-motor de validación de contratos
export const Port = {
    create: (name, definition) => ({
        name,
        definition,
        // El método que usará el Runner para validar el adaptador
        validate: (adapter) => {
            for (const [method, contract] of Object.entries(definition)) {
                if (typeof adapter[method] !== 'function') {
                    throw new Error(`[Port Violation] Adapter for "${name}" is missing method: ${method}`);
                }
            }
            return true;
        }
    })
};