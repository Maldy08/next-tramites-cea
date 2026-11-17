// DTOs de vacaciones: backend CEA api/NomVacaciones (funciones F_SALDO_VACACIONES y FN_CONSULTA_VACACIONES)
// y las solicitudes guardadas (NOM_TRAMITES tipo 1 + NOM_VACAEMP_M/_D).
import type { Tramite } from "@/shared/tramites";

/** SaldoVacacionesDto: a) primer periodo con saldo y b) total pendiente hasta hoy. */
export interface SaldoVacaciones {
  empleado: number;
  nombreCompleto: string;
  fechaAlta: string;
  antiguedadActualAnos: number;
  /** null cuando no tiene ningún periodo con saldo. */
  anoDisponible: number | null;
  periodoDisponible: number | null;
  diasPorDisfrutar: number | null;
  diasTotalesPorDisfrutar: number;
}

/** SimulaVacacionesDto: días que se toman de un periodo (año/semestre) y lo que le queda. */
export interface PeriodoSimulado {
  noEmp: number;
  ano: number;
  dias: number;
  periodo: number;
  diasXDisfrutar: number;
}

/** ConsultaVacacionesDto (FN_CONSULTA_VACACIONES): solicitud de un rango de fechas. */
export interface ConsultaVacaciones {
  /** Lunes a viernes del rango sin los festivos del empleado. */
  diasHabiles: number;
  /** "24/12/2026 (Noche Buena), 25/12/2026 (Navidad)"; null si no cayó ninguno. */
  festivos: string | null;
  /** Reparto de diasHabiles entre periodos (F_SIMULA_VACACIONES); vacío si diasHabiles = 0. */
  periodos: PeriodoSimulado[];
}

/** Ficha del beneficiario que muestra la captura (de api/Empleados/GetEmpleadoById). */
export interface EmpleadoVacaciones {
  empleado: number;
  nombreCompleto: string;
  descripcionPuesto: string;
  descripcionDepto: string;
  deptoComi: number;
}

/** GET /api/vacaciones/saldo/[id] */
export interface SaldoEmpleado {
  empleado: EmpleadoVacaciones;
  saldo: SaldoVacaciones;
}

/** NomDiasFestivosDto (NOM_DIAS_FESTIVOS): día que no se trabaja, ya recorrido si hubo puente. Fechas AAAA-MM-DD. */
export interface DiaFestivo {
  idFestivo: number;
  fechaFestivo: string;
  descripcion: string;
  /** Fecha oficial cuando se recorrió; null si no se movió. */
  fechaOficial: string | null;
  /** "HH:MI". Ambas null = día completo; con alguna = se permite llegar tarde / salir temprano. */
  horaEntrada: string | null;
  horaSalida: string | null;
}

/** Empleado que puede cubrir (relevo); `deptoComi` para el filtro "Únicamente del departamento". */
export type Relevo = EmpleadoVacaciones;

/** SolicitudVacacionesDto (NOM_VACAEMP_M): lo guardado de una solicitud. Fechas AAAA-MM-DD. */
export interface SolicitudVacaciones {
  idVacaemp: number;
  idTramite: number;
  ano: number;
  folio: string;
  noEmp: number;
  diasSolicitados: number;
  fDesde: string;
  fHasta: string;
  /** Primer día de regreso al trabajo. */
  fechaRegreso: string | null;
  /** Relevo opcional. */
  idEmpleadoCubre: number | null;
  periodos: PeriodoSolicitud[];
}

/** NOM_VACAEMP_D: días de la solicitud que se toman de un periodo. */
export interface PeriodoSolicitud {
  /** "AAAA-N", p. ej. "2025-2". */
  perVac: string;
  ano: number;
  diasVac: number;
  /** Lo que le queda al periodo después de la solicitud. */
  diasXDisf: number;
  /** Movimiento en NOM_VACAEMP; null mientras no se aplique. */
  noMov: number | null;
  fDesde: string | null;
  fHasta: string | null;
}

/** GET /api/vacaciones/solicitud/[idTramite]: trámite con bitácora + solicitud. */
export interface DetalleSolicitud {
  tramite: Tramite;
  solicitud: SolicitudVacaciones;
}

/** POST /api/vacaciones/solicitud: lo que captura la pantalla. Días y reparto los recalcula el backend. Fechas AAAA-MM-DD. */
export interface GuardarSolicitudRequest {
  noEmp: number;
  desde: string;
  hasta: string;
  fechaRegreso: string | null;
  idEmpleadoCubre: number | null;
  comentarios: string | null;
}

/** SolicitudVacacionesCreadaDto: trámite generado (estatus 1, CREADO). */
export interface SolicitudCreada {
  idTramite: number;
  idVacaemp: number;
  /** "VAC-0015-2026". */
  folio: string;
  fechaRegreso: string;
}

/** POST /api/vacaciones/solicitud/[idTramite]: cambio de estatus. `comentarios` obligatorio al cancelar. */
export interface AccionSolicitud {
  accion: "enviar" | "cancelar";
  comentarios?: string | null;
}

/** FirmasTramiteDto (FN_TRAMITES_CONSULTA_FIRMAS): NOEMP de quienes firman el trámite del empleado. */
export interface FirmasTramite {
  firma1: number | null;
  firma2: number | null;
}
