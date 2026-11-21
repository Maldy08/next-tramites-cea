"use client";

// Edición de un trámite propio o de su personal (Bandeja → Editar), vía /api/tramites/[idTramite]
// (shared/server/tramites.ts). Solo en Creado o Regresado; el backend lo vuelve a validar.
import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type { DetalleTramite, ModificarTramiteCuerpo } from "@/shared/tramites";

export const getDetalleTramite = async (idTramite: number): Promise<DetalleTramite> =>
  (await DbAdapter.get<Result<DetalleTramite>>(`tramites/${idTramite}`)).data;

/** Regresa el estatus del trámite (no cambia al editar). */
export const modificarTramite = async (idTramite: number, cambios: ModificarTramiteCuerpo): Promise<number> =>
  (await DbAdapter.put<Result<number>>(`tramites/${idTramite}`, cambios)).data;
