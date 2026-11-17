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
  cargar: (ejercicio: number, empleado: { id: number; nombre: string }, recargar: () => void) => Promise<FilaExpediente[]>;
}
