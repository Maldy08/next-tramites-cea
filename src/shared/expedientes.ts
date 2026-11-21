// Contrato de la Bandeja de Trámites (/expedientes): cada módulo convierte sus registros a FilaExpediente
// y la bandeja los junta en una sola tabla (pestañas por tipo, búsqueda, estatus, orden y exportación).
import type { ReactNode } from "react";

/** Color del estatus en la bandeja (ver EstatusExpediente). */
export type TonoEstatus = "info" | "alerta" | "violeta" | "exito" | "peligro" | "neutro";

export interface FilaExpediente {
  /** Única dentro del módulo (p. ej. oficina-viático). */
  clave: string;
  /** Folio oficial que se muestra y se busca. */
  folio: string;
  /** Fecha del trámite, AAAA-MM-DD. */
  fecha: string;
  titulo: string;
  detalle?: string;
  beneficiario: { nombre: string; numero?: number };
  estatus: { etiqueta: string; tono: TonoEstatus };
  /** Botones de la columna Acciones (formatos, editar…). No se exporta. */
  acciones?: ReactNode;
}

export interface ExpedienteModulo {
  /**
   * Trámites del empleado en el ejercicio. `recargar` vuelve a pedir la bandeja: lo llaman las acciones de una fila
   * que cambian el trámite (enviar a firma, cancelar…).
   */
  cargar: (ejercicio: number, empleado: EmpleadoExpediente, recargar: () => void) => Promise<FilaExpediente[]>;
  /**
   * Trámites de todo el personal a cargo del supervisor en una sola consulta. Opcional: si el módulo no lo tiene,
   * la bandeja llama a `cargar` por cada empleado de `personal`.
   */
  cargarPersonal?: (ejercicio: number, personal: EmpleadoExpediente[], recargar: () => void) => Promise<FilaExpediente[]>;
  /**
   * Trámites que el supervisor capturó para otros empleados (p. ej. en suplencia de otro supervisor de su depto).
   * Sin esta función el módulo no aporta nada a "Capturados por mí".
   */
  cargarCapturados?: (ejercicio: number, recargar: () => void) => Promise<FilaExpediente[]>;
}

export interface EmpleadoExpediente {
  id: number;
  nombre: string;
}
