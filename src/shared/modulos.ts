// Contrato que cumple cada subsistema (módulo) del Sistema de Trámites.
// Solo datos y funciones puras: lo importan auth.ts, proxy.ts y el layout.
import type { ComponentType } from "react";

/** Formulario del trámite en el paso 3 de /nuevo; `empleado` = beneficiario (No. de empleado). Ver modules/capturas.ts. */
export type CapturaTramite = ComponentType<{ empleado: number }>;

/** userData que devuelve api/Auth/login del backend CEA (solo lo que se usa). */
export interface UserDataLogin {
  usuario: number;
  noEmpleado: number;
  depto: number;
  deptoDescripcion?: string;
  descripcion?: string;
  nombreCompleto?: string;
  oficina?: number;
  municipio?: number;
  viaticos?: boolean | null;
  viaticosNivel?: number | null;
  /** USUARIOS.TRAMITES: 1 = puede entrar al portal (auth.ts rechaza cualquier otro valor). */
  tramites?: number | null;
  tramitesNivel?: number | null;
  [permiso: string]: unknown;
}

/** Nivel de acceso por módulo: { viaticos: 9, ... }. Sin la llave = sin acceso. */
export type Permisos = Record<string, number>;

/** Íconos disponibles para módulos y menús (ver shared/components/Iconos.tsx). */
export type IconoModulo = "inicio" | "viaticos" | "vacaciones" | "capturar" | "listado" | "documento" | "usuarios" | "ajustes";

/** Color de identidad del trámite en portal y catálogo (ver shared/components/coloresModulo.ts). */
export type ColorModulo = "vino" | "esmeralda" | "azul" | "ambar" | "cielo";

/** Atajo que el portal muestra en el saludo y en la tarjeta del catálogo. */
export interface AccionModulo {
  label: string;
  ruta: string;
  icono: IconoModulo;
  /** La acción principal del trámite (p. ej. "Capturar viático"): botón relleno. */
  principal?: boolean;
}

export interface ModuloTramite {
  /** Llave del módulo en `Permisos` y prefijo de sus APIs (/api/<id>/...). */
  id: string;
  nombre: string;
  descripcion: string;
  /** Prefijo de sus páginas (/viaticos). */
  ruta: string;
  icono: IconoModulo;
  color: ColorModulo;
  accionesRapidas: AccionModulo[];
  /** Nivel del usuario en el módulo a partir del login; null = sin acceso. */
  nivelDesdeLogin: (userData: UserDataLogin) => number | null;
}

export const nivelEnModulo = (permisos: Permisos | undefined, moduloId: string): number | null =>
  permisos && moduloId in permisos ? permisos[moduloId] : null;
