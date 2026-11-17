import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type { AccionRh, DetalleTramiteRh, ModificarRh, TramiteRh } from "@/modules/rh/dtos";

// Todas pasan por el proxy de Next (src/app/api/rh/*), que agrega el Bearer de la sesión.

export const getTramites = async (ano: number): Promise<TramiteRh[]> =>
  (await DbAdapter.get<Result<TramiteRh[]>>(`rh/tramites/${ano}`)).data;

export const getTramite = async (idTramite: number): Promise<DetalleTramiteRh> =>
  (await DbAdapter.get<Result<DetalleTramiteRh>>(`rh/tramite/${idTramite}`)).data;

/** Regresa el estatus nuevo. */
export const accionTramite = async (idTramite: number, accion: AccionRh): Promise<number> =>
  (await DbAdapter.post<Result<number>>(`rh/tramite/${idTramite}`, accion)).data;

export const modificarTramite = async (idTramite: number, cambios: ModificarRh): Promise<number> =>
  (await DbAdapter.put<Result<number>>(`rh/tramite/${idTramite}`, cambios)).data;
