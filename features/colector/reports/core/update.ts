import { Cmd, RemoteData } from '@core/tea-utils';
import { match } from 'ts-pattern';
import { INCIDENT_TYPES, Model } from './model';
import { Msg } from './msg';
import { Cmds } from './cmds';

const parseError = (error: unknown) => (error instanceof Error ? error.message : 'Error inesperado');

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
  return match<Msg, [Model, Cmd]>(msg)
    .with({ type: 'FORM_INIT' }, ({ userStructureId, listeroId, drawId }) => {
      if (!userStructureId) return [model, Cmd.none];
      return [
        {
          ...model,
          userStructureId,
          routeListeroId: listeroId ?? null,
          routeDrawId: drawId ?? null,
          listeros: RemoteData.loading(),
        },
        Cmds.fetchListeros(userStructureId)
      ];
    })
    .with({ type: 'LISTEROS_RECEIVED' }, ({ webData }) => {
      if (webData.type !== 'Success') return [{ ...model, listeros: webData }, Cmd.none];
      const listeros = webData.data;
      const preselected = model.routeListeroId ? listeros.findIndex((l) => l.id === model.routeListeroId) : -1;
      const selectedListeroRow = preselected >= 0 ? preselected : Math.min(model.selectedListeroRow, Math.max(listeros.length - 1, 0));
      const selectedListero = listeros[selectedListeroRow];
      return [
        {
          ...model,
          listeros: webData,
          selectedListeroRow,
          drawsDetail: selectedListero ? RemoteData.loading() : RemoteData.notAsked(),
        },
        selectedListero ? Cmds.fetchDraws(selectedListero.id) : Cmd.none
      ];
    })
    .with({ type: 'LISTERO_SELECTED' }, ({ row }) => {
      if (model.listeros.type !== 'Success') return [model, Cmd.none];
      const selectedListero = model.listeros.data[row];
      return [
        {
          ...model,
          selectedListeroRow: row,
          selectedDrawRow: 0,
          drawsDetail: selectedListero ? RemoteData.loading() : RemoteData.notAsked(),
        },
        selectedListero ? Cmds.fetchDraws(selectedListero.id) : Cmd.none
      ];
    })
    .with({ type: 'DRAWS_RECEIVED' }, ({ webData }) => {
      if (webData.type !== 'Success') return [{ ...model, drawsDetail: webData }, Cmd.none];
      const draws = webData.data.draws;
      const preselected = model.routeDrawId ? draws.findIndex((d) => d.draw_id === model.routeDrawId) : -1;
      const selectedDrawRow = preselected >= 0 ? preselected : Math.min(model.selectedDrawRow, Math.max(draws.length - 1, 0));
      return [{ ...model, drawsDetail: webData, selectedDrawRow, routeDrawId: null }, Cmd.none];
    })
    .with({ type: 'DRAW_SELECTED' }, ({ row }) => [{ ...model, selectedDrawRow: row }, Cmd.none])
    .with({ type: 'INCIDENT_TYPE_SELECTED' }, ({ row }) => [{ ...model, selectedTypeRow: row }, Cmd.none])
    .with({ type: 'DESCRIPTION_CHANGED' }, ({ description }) => [{ ...model, description }, Cmd.none])
    .with({ type: 'SUBMIT_REQUESTED' }, () => {
      if (!model.description.trim()) {
        return [model, Cmd.alert({ title: 'Incompleto', message: 'Por favor, ingresa una descripción de la incidencia.' })];
      }
      if (model.listeros.type !== 'Success' || !model.listeros.data[model.selectedListeroRow]) {
        return [model, Cmd.alert({ title: 'Incompleto', message: 'Por favor, selecciona un listero.' })];
      }

      const selectedListero = model.listeros.data[model.selectedListeroRow];
      const selectedDraw = model.drawsDetail.type === 'Success' ? model.drawsDetail.data.draws[model.selectedDrawRow] : undefined;
      const incidentType = INCIDENT_TYPES[model.selectedTypeRow]?.title || INCIDENT_TYPES[0].title;
      const description = model.description.trim();

      return [
        { ...model, submission: RemoteData.loading() },
        Cmds.submitIncident(
          {
            structure: selectedListero.id,
            draw: selectedDraw?.draw_id || null,
            incident_type: incidentType,
            description,
          },
          parseError
        )
      ];
    })
    .with({ type: 'SUBMIT_SUCCEEDED' }, () => [{ ...model, submission: RemoteData.success(null) }, Cmd.none])
    .with({ type: 'SUBMIT_FAILED' }, ({ error }) => [
      { ...model, submission: RemoteData.failure(error) },
      Cmd.alert({ title: 'Error', message: 'No se pudo enviar el reporte. Por favor, intenta de nuevo.' })
    ])
    .exhaustive();
};
