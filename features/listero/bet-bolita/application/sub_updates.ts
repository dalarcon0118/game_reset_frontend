/**
 * sub_updates.ts - Punto de entrada para los handlers modulares de Bolita.
 * Este archivo delega la lógica de actualización a módulos específicos por feature.
 */

export { updateFijos } from './sub_updates/fijos.update';
export { updateParlet } from './sub_updates/parlet.update';
export { updateCentena } from './sub_updates/centena.update';
export { updateList } from './sub_updates/list.update';
export { updateEdit } from './sub_updates/edit.update';
