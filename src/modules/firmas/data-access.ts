import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type { AccionFirma, TramitePorFirmar } from "@/modules/firmas/dtos";

// Pasan por el proxy de Next (src/app/api/firmas/*), que agrega el Bearer de la sesión.

export const getPorFirmar = async (): Promise<TramitePorFirmar[]> =>
  (await DbAdapter.get<Result<TramitePorFirmar[]>>("firmas/tramites")).data;

/** Regresa el estatus nuevo. */
export const accionFirma = async (idTramite: number, accion: AccionFirma): Promise<number> =>
  (await DbAdapter.post<Result<number>>(`firmas/tramite/${idTramite}`, accion)).data;
