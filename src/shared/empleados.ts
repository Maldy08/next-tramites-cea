// Compañeros para "En Representación de un Compañero" (Generar Nuevo Trámite, paso 1). Solo para supervisores:
// - "mios": empleados cuyo EMPLEADOS.SUPERVISOR_ID es el usuario de la sesión;
// - "departamento" (suplencia, p. ej. otro supervisor de vacaciones): empleados CON supervisor asignado del mismo
//   EMPLEADOS.DEPTOCOMI que el usuario (el de su ficha de empleado, no USUARIOS.DEPTO).

/** USUARIOS.TRAMITES_NIVEL desde el cual el usuario tiene gente a su cargo (supervisores). */
export const NIVEL_SUPERVISOR = 2;

export const esSupervisor = (tramitesNivel?: number | null) => (tramitesNivel ?? 0) >= NIVEL_SUPERVISOR;

/** USUARIOS.TRAMITES_NIVEL del administrador de RH: ve y opera todos los trámites de NOM_TRAMITES (/rh/tramites). */
export const NIVEL_ADMIN_RH = 9;

export const esAdministradorRh = (tramitesNivel?: number | null) => (tramitesNivel ?? 0) >= NIVEL_ADMIN_RH;

export type AlcanceCompaneros = "mios" | "departamento";

export interface Companero {
  empleado: number;
  nombreCompleto: string;
  descripcionPuesto: string;
  descripcionDepto: string;
  /** Su supervisor (SUPERVISOR_ID), para agrupar la lista en la suplencia. */
  supervisor: { empleado: number; nombre: string };
}
