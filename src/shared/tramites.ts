// Trámites de RH comunes a los módulos que guardan en NOM_TRAMITES (backend CEA api/NomTramites).
// Hoy solo vacaciones; viáticos tiene sus propias tablas. Los catálogos son copia de RH_CAT_TIPOS_TRAMITE y
// RH_CAT_ESTATUS (Oracle): si cambian allá, cambiarlos aquí.
import type { TonoEstatus } from "./expedientes";

/** NOM_TRAMITES.TIPO_TRAMITE */
export const TIPO_TRAMITE = {
  vacaciones: 1,
  viaticos: 2,
  permisos: 3,
  justificantes: 4,
  incapacidades: 5,
} as const;

/** NOM_TRAMITES.ESTATUS / NOM_TRAMITES_BITACORA.ID_ESTATUS */
export const ESTATUS_TRAMITE = {
  creado: 1,
  revisionJefe: 2,
  revisionDirector: 3,
  revisionRh: 4,
  revisionFinanzas: 5,
  regresado: 98,
  cancelado: 99,
  autorizado: 100,
  reprogramado: 101,
  pagado: 110,
} as const;

const ETIQUETAS: Record<number, { etiqueta: string; tono: TonoEstatus }> = {
  1: { etiqueta: "Creado", tono: "neutro" },
  2: { etiqueta: "Revisión Jefe", tono: "info" },
  3: { etiqueta: "Revisión Director", tono: "violeta" },
  4: { etiqueta: "Revisión RH", tono: "alerta" },
  5: { etiqueta: "Revisión Finanzas", tono: "alerta" },
  98: { etiqueta: "Regresado", tono: "alerta" },
  99: { etiqueta: "Cancelado", tono: "peligro" },
  100: { etiqueta: "Autorizado", tono: "exito" },
  101: { etiqueta: "Reprogramado", tono: "info" },
  110: { etiqueta: "Pagado", tono: "exito" },
};

export const estatusTramite = (estatus: number) => ETIQUETAS[estatus] ?? { etiqueta: String(estatus), tono: "neutro" as const };

/** NomTramiteDto. Fechas ISO tal como las manda el backend (con hora). */
export interface Tramite {
  idTramite: number;
  ano: number;
  /** Folio oficial, p. ej. VAC-001/2026. */
  folio: string;
  tipoTramite: number;
  /** Beneficiario. */
  idEmpleado: number;
  /** "P" autogestión, "S" capturado por el supervisor (idEmpleadoSupervisor). */
  ambito: "P" | "S";
  idEmpleadoSupervisor: number | null;
  fechaSolicitud: string;
  estatus: number;
  fechaAutorizacion: string | null;
  fechaCancelacion: string | null;
  /** NOEMP de quienes firman (NOM_TRAMITES.VALIDA_1 / VALIDA_2); null en trámites anteriores. */
  valida1: number | null;
  valida2: number | null;
  /** Nombres de VALIDA_1 / VALIDA_2; solo en el detalle. */
  nombreValida1?: string | null;
  nombreValida2?: string | null;
  /** Nombre del beneficiario; solo en las listas del supervisor (personal a cargo / capturados por mí). */
  nombreEmpleado?: string | null;
  /** Solo viene llena en el detalle de un trámite; en listados va vacía. */
  bitacora: MovimientoTramite[];
}

/** NomTramiteBitacoraDto: un movimiento del trámite. */
export interface MovimientoTramite {
  idBitacora: number;
  fechaMovimiento: string;
  /** Quien hizo la acción. */
  idEmpleado: number;
  /** Nombre de quien hizo la acción; solo en el detalle. */
  nombreEmpleado?: string | null;
  /** Estatus en que quedó el trámite. */
  idEstatus: number;
  accion: string;
  comentarios: string | null;
}

/**
 * NOM_PERMISOS_JUSTIFICANTES.TIPO_INCIDENCIA: 1-2 son permisos (trámite 3), 3-7 justificantes (trámite 4).
 * `captura`: dia = días completos (puede ser rango); rango = un día con hora de inicio y fin; hora = un día y una hora.
 */
export const INCIDENCIAS: readonly { id: number; nombre: string; tipoTramite: number; captura: "dia" | "rango" | "hora" }[] = [
  { id: 1, nombre: "Permiso con goce de sueldo", tipoTramite: TIPO_TRAMITE.permisos, captura: "dia" },
  { id: 2, nombre: "Permiso sin goce de sueldo", tipoTramite: TIPO_TRAMITE.permisos, captura: "dia" },
  { id: 3, nombre: "Justificación de entrada", tipoTramite: TIPO_TRAMITE.justificantes, captura: "rango" },
  { id: 4, nombre: "Justificación de salida", tipoTramite: TIPO_TRAMITE.justificantes, captura: "rango" },
  { id: 5, nombre: "Justificación de no checada de entrada", tipoTramite: TIPO_TRAMITE.justificantes, captura: "hora" },
  { id: 6, nombre: "Justificación de no checada de salida", tipoTramite: TIPO_TRAMITE.justificantes, captura: "hora" },
  { id: 7, nombre: "Justificación de no checada (todo el día)", tipoTramite: TIPO_TRAMITE.justificantes, captura: "dia" },
];

// ---- Edición de un trámite (RH en cualquier estatus; empleado o supervisor solo en Creado/Regresado) ----

/** Estatus en que el empleado o su supervisor todavía pueden editar (mismo que ReglasRh.EditablesEmpleado). */
export const EDITABLES_EMPLEADO: number[] = [ESTATUS_TRAMITE.creado, ESTATUS_TRAMITE.regresado];

/** SolicitudVacacionesDto (lo que se edita). */
export interface VacacionesDetalle {
  idVacaemp: number;
  diasSolicitados: number;
  fDesde: string;
  fHasta: string;
  fechaRegreso: string | null;
  idEmpleadoCubre: number | null;
}

/** PermisoJustificanteDto. */
export interface PermisoJustificanteDetalle {
  idPermisoJustificante: number;
  tipoIncidencia: number;
  fechaInicio: string;
  fechaFin: string;
  justificacionMotivo: string;
  idEmpleadoCubre: number | null;
}

/** DetalleTramiteRhDto: trámite con bitácora y su detalle según el tipo. */
export interface DetalleTramite {
  tramite: Tramite;
  nombreEmpleado: string | null;
  vacaciones: VacacionesDetalle | null;
  permisoJustificante: PermisoJustificanteDetalle | null;
}

/** Cuerpo del PUT de modificación según el tipo. Fechas AAAA-MM-DD o AAAA-MM-DDTHH:MI. El relevo se conserva. */
export type ModificarTramiteCuerpo =
  | { tipo: "vacaciones"; desde: string; hasta: string; fechaRegreso: string | null; comentarios: string }
  | {
      tipo: "permisoJustificante";
      tipoIncidencia: number;
      fechaInicio: string;
      fechaFin: string;
      justificacionMotivo: string;
      comentarios: string;
    };
