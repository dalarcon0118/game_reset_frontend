import { CreateBetDTO } from './types';

export const sanitizeCreateBetData = (betData: CreateBetDTO): CreateBetDTO => {
    const sanitizedData: CreateBetDTO = { ...betData };
    if (sanitizedData.fijosCorridos) {
        sanitizedData.fijosCorridos = sanitizedData.fijosCorridos.map(item => {
            const sanitizedItem: any = { ...item };
            if (sanitizedItem.fijoAmount !== undefined && sanitizedItem.fijoAmount <= 0) {
                sanitizedItem.fijoAmount = undefined;
            }
            if (sanitizedItem.corridoAmount !== undefined && sanitizedItem.corridoAmount <= 0) {
                sanitizedItem.corridoAmount = undefined;
            }
            return sanitizedItem;
        });
    }
    return sanitizedData;
};
