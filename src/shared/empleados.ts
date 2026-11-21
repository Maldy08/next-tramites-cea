// Compañeros para "En Representación de un Compañero" (Generar Nuevo Trámite, paso 1). Solo para supervisores:
// - "mios": empleados cuyo EMPLEADOS.SUPERVISOR_ID es el usuario de la sesión;
// - "departamento" (suplencia, p. ej. otro supervisor de vacaciones): empleados CON supervisor asignado del mismo
//   EMPLEADOS.DEPTOCOMI que el usuario (el de su ficha de empleado, no USUARIOS.DEPTO).

// USUARIOS.TRAMITES_NIVEL: cada nivel es un ROL EXACTO (no jerárquico; se compara por lista, nunca con >=).
//   0/1 = empleado normal, 2 = supervisor, 3 = firmante (jefe/director: VALIDA_1/VALIDA_2), 9 = administrador de RH.
//   Hacer trámites de otros (En Representación): 2 y 3. Validar/autorizar: 3 (los suyos) y 9 (RH).

/** Supervisor: tiene gente a su cargo (EMPLEADOS.SUPERVISOR_ID = él) y hace trámites en su representación. */
export const NIVEL_SUPERVISOR = 2;

/** Firmante: jefe o director que valida trámites (NOM_TRAMITES.VALIDA_1 / VALIDA_2). */
export const NIVEL_FIRMANTE = 3;

/** Puede hacer trámites en representación de compañeros (supervisor o firmante). */
export const esSupervisor = (tramitesNivel?: number | null) =>
  tramitesNivel === NIVEL_SUPERVISOR || tramitesNivel === NIVEL_FIRMANTE;

/**
 * Bandeja "Mi personal a cargo" (/expedientes): solo el nivel 2 ve y opera (enviar, cancelar, editar; no autorizar)
 * los trámites de los empleados con EMPLEADOS.SUPERVISOR_ID = él. El firmante (3) los ve hasta que se los envían a firma.
 */
export const tienePersonalACargo = (tramitesNivel?: number | null) => tramitesNivel === NIVEL_SUPERVISOR;

export const esFirmante = (tramitesNivel?: number | null) => tramitesNivel === NIVEL_FIRMANTE;

/** Administrador de RH: ve y opera todos los trámites de NOM_TRAMITES (/rh/tramites). */
export const NIVEL_ADMIN_RH = 9;

export const esAdministradorRh = (tramitesNivel?: number | null) => tramitesNivel === NIVEL_ADMIN_RH;

export type AlcanceCompaneros = "mios" | "departamento";

export interface Companero {
  empleado: number;
  nombreCompleto: string;
  descripcionPuesto: string;
  descripcionDepto: string;
  /** Su supervisor (SUPERVISOR_ID), para agrupar la lista en la suplencia. */
  supervisor: { empleado: number; nombre: string };
}
