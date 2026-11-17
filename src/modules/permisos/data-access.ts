import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type { Tramite } from "@/shared/tramites";
import type {
  AccionSolicitud,
  DiaFestivo,
  EmpleadoPermiso,
  GuardarPermisoRequest,
  PermisoCreado,
  Relevo,
} from "@/modules/permisos/dtos";

// Todas pasan por el proxy de Next (src/app/api/permisos/*), que agrega el Bearer de la sesión.

export const getEmpleado = async (empleado: number): Promise<EmpleadoPermiso> =>
  (await DbAdapter.get<Result<EmpleadoPermiso>>(`permisos/empleado/${empleado}`)).data;

export const getRelevos = async (empleado: number): Promise<Relevo[]> =>
  (await DbAdapter.get<Result<Relevo[]>>(`permisos/relevos/${empleado}`)).data;

export const getFestivos = async (empleado: number, desde: string, hasta: string): Promise<DiaFestivo[]> =>
  (await DbAdapter.get<Result<DiaFestivo[]>>(`permisos/festivos/${empleado}?desde=${desde}&hasta=${hasta}`)).data;

export const getSolicitudes = async (empleado: number, ano: number): Promise<Tramite[]> =>
  (await DbAdapter.get<Result<Tramite[]>>(`permisos/solicitudes/${empleado}?ano=${ano}`)).data;

export const guardarPermiso = async (solicitud: GuardarPermisoRequest): Promise<PermisoCreado> =>
  (await DbAdapter.post<Result<PermisoCreado>>("permisos/solicitud", solicitud)).data;

/** Regresa el estatus nuevo del trámite. */
export const accionSolicitud = async (idTramite: number, accion: AccionSolicitud): Promise<number> =>
  (await DbAdapter.post<Result<number>>(`permisos/solicitud/${idTramite}`, accion)).data;
