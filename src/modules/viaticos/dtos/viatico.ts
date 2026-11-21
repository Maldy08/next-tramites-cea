// Viático completo (GetAllViaticosDto del backend). Las fechas llegan como "YYYY-MM-DDTHH:mm:ss".
export interface Viatico {
  oficina: number;
  ejercicio: number;
  noViat: number;
  fecha: string;
  noEmp: number;
  origenId: number;
  destinoId: number;
  motivo: string;
  fechaSal: string;
  fechaReg: string;
  dias: number;
  inforFecha: string;
  inforAct: string;
  nota?: string | null;
  estatus: number;
  fechaMod?: string | null;
  pol?: number | null;
  polMes?: number | null;
  caja?: number | null;
  cajaVale?: number | null;
  cajaRepo?: number | null;
  noEmpCrea: number;
  inforResul: string;
}

// Renglón del listado (ViaticosPorEmpleadoDto). `estatus` llega como texto ("1", "9", ...).
export interface ViaticoListado {
  viatico: number;
  fecha: string;
  origen: string;
  destino: string;
  motivo: string;
  salida: string;
  regreso: string;
  estatus: string;
  oficina: number;
  ejercicio: number;
}

/** ViaticoCapturadoDto: viático que el supervisor capturó para otro empleado (NOEMP_CREA = él). */
export interface ViaticoCapturado {
  oficina: number;
  ejercicio: number;
  noViat: number;
  noEmp: number;
  nombreEmpleado: string | null;
}

/**
 * Lo que manda el formulario (fechas "YYYY-MM-DD"). El proxy calcula folio, días, partida e
 * importe, y completa el empleado que captura y los valores fijos.
 */
export interface GuardarViaticoRequest {
  ejercicio: number;
  noEmp: number;
  /** Solo al modificar. */
  oficina?: number;
  noViat?: number;
  fecha: string;
  fechaSal: string;
  fechaReg: string;
  origenId: number;
  destinoId: number;
  motivo: string;
  inforAct: string;
}

export interface GuardarViaticoResponse {
  oficina: number;
  ejercicio: number;
  noViat: number;
  importe: number;
}

export type FormatoViatico = "TresFormatos" | "FormatoComision" | "ReciboViatico" | "InformeActividades";
