// DTOs de permisos: NOM_TRAMITES tipo 3 + NOM_PERMISOS_JUSTIFICANTES (backend CEA api/NomPermisosJustificantes).

/** NOM_PERMISOS_JUSTIFICANTES.TIPO_INCIDENCIA que son permisos (los 3-7 son justificantes, trámite 4). */
export const INCIDENCIAS_PERMISO = [
  { id: 1, nombre: "Permiso con goce de sueldo" },
  { id: 2, nombre: "Permiso sin goce de sueldo" },
] as const;

/** Ficha del beneficiario (api/Empleados/GetEmpleadoById); `deptoComi` para el filtro de relevos. */
export interface EmpleadoPermiso {
  empleado: number;
  nombreCompleto: string;
  descripcionPuesto: string;
  descripcionDepto: string;
  deptoComi: number;
}

export type Relevo = EmpleadoPermiso;

/** Festivo del empleado (NomDiasFestivos/Empleado). Fechas AAAA-MM-DD; con hora de entrada/salida sí se trabaja. */
export interface DiaFestivo {
  fechaFestivo: string;
  descripcion: string;
  horaEntrada: string | null;
  horaSalida: string | null;
}

/** POST /api/permisos/solicitud. Fechas AAAA-MM-DD; los días hábiles los recalcula el backend. */
export interface GuardarPermisoRequest {
  noEmp: number;
  tipoIncidencia: number;
  fechaInicio: string;
  fechaFin: string;
  justificacionMotivo: string;
  idEmpleadoCubre: number | null;
}

/** PermisoJustificanteCreadoDto: trámite generado (estatus 1, CREADO). */
export interface PermisoCreado {
  idTramite: number;
  idPermisoJustificante: number;
  /** "PER-0003-2026". */
  folio: string;
  diasHabiles: number | null;
}

/** POST /api/permisos/solicitud/[idTramite]: cambio de estatus. `comentarios` obligatorio al cancelar. */
export interface AccionSolicitud {
  accion: "enviar" | "cancelar";
  comentarios?: string | null;
}
