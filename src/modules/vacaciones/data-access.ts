import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type { Tramite } from "@/shared/tramites";
import type {
  AccionSolicitud,
  ConsultaVacaciones,
  DetalleSolicitud,
  DiaFestivo,
  FirmasTramite,
  GuardarSolicitudRequest,
  Relevo,
  SaldoEmpleado,
  SolicitudCreada,
} from "@/modules/vacaciones/dtos";

// Todas pasan por el proxy de Next (src/app/api/vacaciones/*), que agrega el Bearer de la sesión.

export const getSaldo = async (empleado: number): Promise<SaldoEmpleado> =>
  (await DbAdapter.get<Result<SaldoEmpleado>>(`vacaciones/saldo/${empleado}`)).data;

export const getConsulta = async (empleado: number, desde: string, hasta: string): Promise<ConsultaVacaciones> =>
  (await DbAdapter.get<Result<ConsultaVacaciones>>(`vacaciones/simula/${empleado}?desde=${desde}&hasta=${hasta}`)).data;

export const getRelevos = async (empleado: number): Promise<Relevo[]> =>
  (await DbAdapter.get<Result<Relevo[]>>(`vacaciones/relevos/${empleado}`)).data;

export const getSolicitudes = async (empleado: number, ano: number): Promise<Tramite[]> =>
  (await DbAdapter.get<Result<Tramite[]>>(`vacaciones/solicitudes/${empleado}?ano=${ano}`)).data;

export const getSolicitud = async (idTramite: number): Promise<DetalleSolicitud> =>
  (await DbAdapter.get<Result<DetalleSolicitud>>(`vacaciones/solicitud/${idTramite}`)).data;

export const getFestivos = async (empleado: number, desde: string, hasta: string): Promise<DiaFestivo[]> =>
  (await DbAdapter.get<Result<DiaFestivo[]>>(`vacaciones/festivos/${empleado}?desde=${desde}&hasta=${hasta}`)).data;

export const guardarSolicitud = async (solicitud: GuardarSolicitudRequest): Promise<SolicitudCreada> =>
  (await DbAdapter.post<Result<SolicitudCreada>>("vacaciones/solicitud", solicitud)).data;

/** Regresa el estatus nuevo del trámite. */
export const accionSolicitud = async (idTramite: number, accion: AccionSolicitud): Promise<number> =>
  (await DbAdapter.post<Result<number>>(`vacaciones/solicitud/${idTramite}`, accion)).data;

/** NOEMP de quienes firman el trámite del empleado (según su departamento). */
export const getFirmas = async (empleado: number): Promise<FirmasTramite> =>
  (await DbAdapter.get<Result<FirmasTramite>>(`vacaciones/firmas/${empleado}`)).data;
