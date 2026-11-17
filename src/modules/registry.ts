// Registro de subsistemas del Sistema de Trámites CEA.
// Para incorporar un trámite: crear src/modules/<id>/, exportar su ModuloTramite en modulo.ts
// y agregarlo a MODULOS. El portal, "Generar Nuevo Trámite" y el control de acceso salen de aquí.
import type { ModuloTramite, Permisos, UserDataLogin } from "@/shared/modulos";
import { justificantesModulo } from "./justificantes/modulo";
import { permisosModulo } from "./permisos/modulo";
import { vacacionesModulo } from "./vacaciones/modulo";
import { viaticosModulo } from "./viaticos/modulo";

export const MODULOS: ModuloTramite[] = [viaticosModulo, vacacionesModulo, permisosModulo, justificantesModulo];

/** Permisos por módulo que se guardan en la sesión al iniciar sesión. */
export const permisosDesdeLogin = (userData: UserDataLogin): Permisos => {
  const permisos: Permisos = {};
  for (const m of MODULOS) {
    const nivel = m.nivelDesdeLogin(userData);
    if (nivel !== null && nivel !== undefined) permisos[m.id] = nivel;
  }
  return permisos;
};

export const moduloDeRuta = (pathname: string) =>
  MODULOS.find((m) => pathname === m.ruta || pathname.startsWith(`${m.ruta}/`));

export const modulosDisponibles = (permisos: Permisos | undefined) =>
  MODULOS.filter((m) => permisos && m.id in permisos);

/** Rutas de la acción principal de cada trámite: el sidebar marca "Generar Nuevo Trámite" en ellas. */
export const rutasNuevoTramite = (permisos: Permisos | undefined) =>
  modulosDisponibles(permisos).flatMap((m) => m.accionesRapidas.filter((a) => a.principal).map((a) => a.ruta));
