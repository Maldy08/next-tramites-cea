// DTOs de justificantes: NOM_TRAMITES tipo 4 + NOM_PERMISOS_JUSTIFICANTES (backend CEA api/NomPermisosJustificantes).

/** Cómo se captura la fecha/hora de cada incidencia. */
export type CapturaHora = "rango" | "hora" | "dia";

/**
 * NOM_PERMISOS_JUSTIFICANTES.TIPO_INCIDENCIA de justificantes (1-2 son permisos, trámite 3).
 * rango = un día con hora de inicio y fin; hora = un día y una hora; dia = días completos (puede ser rango).
 */
export const INCIDENCIAS_JUSTIFICANTE: readonly { id: number; nombre: string; captura: CapturaHora }[] = [
  { id: 3, nombre: "Justificación de entrada", captura: "rango" },
  { id: 4, nombre: "Justificación de salida", captura: "rango" },
  { id: 5, nombre: "Justificación de no checada de entrada", captura: "hora" },
  { id: 6, nombre: "Justificación de no checada de salida", captura: "hora" },
  { id: 7, nombre: "Justificación de no checada (todo el día)", captura: "dia" },
];

/** Ficha del beneficiario (api/Empleados/GetEmpleadoById). */
export interface EmpleadoJustificante {
  empleado: number;
  nombreCompleto: string;
  descripcionPuesto: string;
  descripcionDepto: string;
}

/** POST /api/justificantes/solicitud. Fechas "AAAA-MM-DDTHH:MI" (hora 00:00 en los de día completo). */
export interface GuardarJustificanteRequest {
  noEmp: number;
  tipoIncidencia: number;
  fechaInicio: string;
  fechaFin: string;
  justificacionMotivo: string;
}

/** PermisoJustificanteCreadoDto: trámite generado (estatus 1, CREADO). */
export interface JustificanteCreado {
  idTramite: number;
  idPermisoJustificante: number;
  /** "JUS-0006-2026". */
  folio: string;
}

/** POST /api/justificantes/solicitud/[idTramite]: cambio de estatus. `comentarios` obligatorio al cancelar. */
export interface AccionSolicitud {
  accion: "enviar" | "cancelar";
  comentarios?: string | null;
}
