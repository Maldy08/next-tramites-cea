// DTOs de la Administración de Trámites de RH (backend CEA api/NomTramitesRh). Solo TRAMITES_NIVEL 9.
import type {
  DetalleTramite,
  ModificarTramiteCuerpo,
  PermisoJustificanteDetalle,
  Tramite,
  VacacionesDetalle,
} from "@/shared/tramites";

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

// Detalle y edición: tipos compartidos con la edición del empleado (shared/tramites.ts).
export type VacacionesRh = VacacionesDetalle;
export type PermisoJustificanteRh = PermisoJustificanteDetalle;
export type DetalleTramiteRh = DetalleTramite;

/** POST /api/rh/tramite/[idTramite]. */
export interface AccionRh {
  accion: "completar" | "cancelar";
  comentarios?: string | null;
}

/** PUT /api/rh/tramite/[idTramite]: según el tipo del trámite (motivo obligatorio para RH). */
export type ModificarRh = ModificarTramiteCuerpo;

// ---- Saldos de vacaciones (punto de partida de F_SALDO_VACACIONES; api/NomTramitesRh/SaldosVacaciones) ----

/** SaldoVacacionesRhDto: empleado activo con su saldo y el último registro de NOM_VACAEMP_M/_D. */
export interface SaldoVacacionesRh {
  empleado: number;
  nombreCompleto: string;
  departamento: string | null;
  fechaAlta: string;
  antiguedadAnos: number;
  anoDisponible: number | null;
  periodoDisponible: number | null;
  diasPorDisfrutar: number | null;
  diasTotales: number;
  /** "T" trámite / "R" capturado por RH / null = sin punto de partida (F_SALDO cuenta desde el año de alta). */
  ultimoOrigen: "T" | "R" | null;
  ultimoFolio: string | null;
  ultimoPerVac: string | null;
  ultimoDiasXDisf: number | null;
  ultimaFecha: string | null;
}

/** RegistroVacacionesRhDto: historial M/D del empleado. */
export interface RegistroVacacionesRh {
  idVacaemp: number;
  origen: "T" | "R";
  idTramite: number | null;
  folio: string | null;
  estatus: number | null;
  fDesde: string;
  fHasta: string;
  diasSolicitados: number;
  perVac: string | null;
  diasXDisf: number | null;
  idEmpleadoCaptura: number | null;
  fechaCaptura: string | null;
}

/** POST /api/rh/saldos/[noEmp]. perVac "AAAA-N". La fecha del registro la pone el backend (el día de la captura). */
export interface SaldoInicialRh {
  perVac: string;
  diasXDisf: number;
}
