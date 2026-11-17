// DTOs de la Administración de Trámites de RH (backend CEA api/NomTramitesRh). Solo TRAMITES_NIVEL 9.
import type { Tramite } from "@/shared/tramites";

/** Tipos de NOM_TRAMITES que administra RH (viáticos va aparte). */
export const TIPOS_RH = [
  { id: 1, nombre: "Vacaciones" },
  { id: 3, nombre: "Permisos" },
  { id: 4, nombre: "Justificantes" },
] as const;

/** TramiteRhDto: renglón de la administración. Fechas ISO con hora. */
export interface TramiteRh extends Tramite {
  nombreEmpleado: string | null;
  descripcionDepto: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  tipoIncidencia: number | null;
}

/** SolicitudVacacionesDto (lo que se edita). */
export interface VacacionesRh {
  idVacaemp: number;
  diasSolicitados: number;
  fDesde: string;
  fHasta: string;
  fechaRegreso: string | null;
  idEmpleadoCubre: number | null;
}

/** PermisoJustificanteDto. */
export interface PermisoJustificanteRh {
  idPermisoJustificante: number;
  tipoIncidencia: number;
  fechaInicio: string;
  fechaFin: string;
  justificacionMotivo: string;
  idEmpleadoCubre: number | null;
}

/** DetalleTramiteRhDto. */
export interface DetalleTramiteRh {
  tramite: Tramite;
  nombreEmpleado: string | null;
  vacaciones: VacacionesRh | null;
  permisoJustificante: PermisoJustificanteRh | null;
}

/** POST /api/rh/tramite/[idTramite]. */
export interface AccionRh {
  accion: "completar" | "cancelar";
  comentarios?: string | null;
}

/** PUT /api/rh/tramite/[idTramite]: según el tipo del trámite. Fechas AAAA-MM-DD o AAAA-MM-DDTHH:MI. */
export type ModificarRh =
  | { tipo: "vacaciones"; desde: string; hasta: string; fechaRegreso: string | null; comentarios: string }
  | {
      tipo: "permisoJustificante";
      tipoIncidencia: number;
      fechaInicio: string;
      fechaFin: string;
      justificacionMotivo: string;
      comentarios: string;
    };
