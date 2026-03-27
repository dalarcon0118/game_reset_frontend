import { Cmd, RemoteDataHttp } from '@core/tea-utils';
import { Msg } from './msg';
import { createReportsService, ReportsService } from './service';

export const createReportsCmds = (service: ReportsService) => ({
  fetchListeros: (structureId: number): Cmd =>
    structureId > 0
      ? RemoteDataHttp.fetch(
        () => service.getListeros(structureId),
        (webData) => ({ type: 'LISTEROS_RECEIVED', webData } as Msg)
      )
      : Cmd.none,

  fetchDraws: (listeroId: number): Cmd =>
    listeroId > 0
      ? RemoteDataHttp.fetch(
        () => service.getDraws(listeroId),
        (webData) => ({ type: 'DRAWS_RECEIVED', webData } as Msg)
      )
      : Cmd.none,

  submitIncident: (
    payload: {
      structure: number;
      draw: number | null;
      incident_type: string;
      description: string;
    },
    onError: (error: unknown) => string
  ): Cmd =>
    Cmd.task({
      task: () => service.submitIncident(payload),
      onSuccess: () => ({ type: 'SUBMIT_SUCCEEDED' } as Msg),
      onFailure: (error) => ({ type: 'SUBMIT_FAILED', error: onError(error) } as Msg),
    }),
});

export const Cmds = createReportsCmds(createReportsService());
