import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type { Tramite } from "@/shared/tramites";
import type {
  AccionSolicitud,
  EmpleadoJustificante,
  GuardarJustificanteRequest,
  JustificanteCreado,
} from "@/modules/justificantes/dtos";

// Todas pasan por el proxy de Next (src/app/api/justificantes/*), que agrega el Bearer de la sesión.

export const getEmpleado = async (empleado: number): Promise<EmpleadoJustificante> =>
  (await DbAdapter.get<Result<EmpleadoJustificante>>(`justificantes/empleado/${empleado}`)).data;

export const getSolicitudes = async (empleado: number, ano: number): Promise<Tramite[]> =>
  (await DbAdapter.get<Result<Tramite[]>>(`justificantes/solicitudes/${empleado}?ano=${ano}`)).data;

export const guardarJustificante = async (solicitud: GuardarJustificanteRequest): Promise<JustificanteCreado> =>
  (await DbAdapter.post<Result<JustificanteCreado>>("justificantes/solicitud", solicitud)).data;

/** Regresa el estatus nuevo del trámite. */
export const accionSolicitud = async (idTramite: number, accion: AccionSolicitud): Promise<number> =>
  (await DbAdapter.post<Result<number>>(`justificantes/solicitud/${idTramite}`, accion)).data;
