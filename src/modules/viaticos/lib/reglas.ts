// Reglas de negocio de viáticos, portadas tal cual de viaticos-cea-frontend
// (helpers/importePorDias.ts, helpers/getDays.ts y CapturarViaticos.tsx).
import type { Ciudad, Estado } from "@/modules/viaticos/dtos";

export const NIVEL_ADMIN_VIATICOS = 9;
/** Nivel 9: puede capturar y consultar a nombre de empleados de su departamento. */
export const esNivelAdmin = (nivel?: number | null) => nivel === NIVEL_ADMIN_VIATICOS;

export const PARTIDA_EN_PAIS = { partida: 37501, descripcion: "VIATICOS EN EL PAIS" } as const;
export const PARTIDA_FUERA_PAIS = { partida: 37601, descripcion: "VIATICOS FUERA DEL PAIS" } as const;

export const INFOR_RESUL =
  "LAS ACTIVIDADES QUE SE ASIGNARON EN LA COMISION FUERON REALIZADAS SATISFACTORIAMENTE * VERSION WEB";

export const CIUDADES_ORIGEN = [
  { id: 1, nombre: "MEXICALI" },
  { id: 2, nombre: "TIJUANA" },
];

export const ESTATUS_VIATICO: Record<string, string> = {
  "1": "Creado",
  "2": "Pagado de C.C.",
  "3": "Registrado en Cont.",
  "4": "Pagado en Cont.",
  "9": "Cancelado",
};

export const ESTATUS_CANCELADO = 9;

// Tarifas diarias por nivel del empleado (actualizadas el 04/04/2024).
const TARIFAS = {
  dentroEstado: { nivel1: 270, nivel2: 300, titular: 350 },
  fueraEstado: { nivel1: 400, nivel2: 500, titular: 600 },
};

export const importePorDias = (dias: number, nivelEmpleado: number, fueraDelEstado: boolean): number => {
  const t = fueraDelEstado ? TARIFAS.fueraEstado : TARIFAS.dentroEstado;
  const tarifa = nivelEmpleado < 17 ? t.nivel1 : nivelEmpleado <= 19 ? t.nivel2 : t.titular;
  return tarifa * dias;
};

/** Ciudad de origen por oficina del empleado: oficinas 1, 2 y 5 salen de Mexicali, la 3 de Tijuana. */
export const origenPorOficina = (oficina: number, municipio?: number): number => {
  if ([1, 2, 5].includes(oficina)) return 1;
  if (oficina === 3) return 2;
  return municipio === 2 ? 2 : 1;
};

/**
 * Determina si el destino es fuera del estado / fuera del país y la partida presupuestal que aplica.
 * Se usa en el navegador (para mostrar el importe) y en el proxy (que es quien lo guarda).
 */
export const clasificarDestino = (destinoId: number, estado?: Pick<Estado, "idEstado" | "idPais"> | null) => {
  if (!destinoId || !estado) {
    return { fueraDelEstado: false, fueraDelPais: false, ...PARTIDA_EN_PAIS };
  }
  // Misma regla que el sistema anterior: fuera del estado si idEstado > 2, salvo las ciudades 1-6.
  const fueraDelEstado = estado.idEstado > 2 && destinoId > 6;
  const fueraDelPais = estado.idPais > 1;
  return { fueraDelEstado, fueraDelPais, ...(fueraDelPais ? PARTIDA_FUERA_PAIS : PARTIDA_EN_PAIS) };
};

export const estadoDeCiudad = (destinoId: number, ciudades: Ciudad[], estados: Estado[]) => {
  const ciudad = ciudades.find((c) => c.idCiudad === destinoId);
  return ciudad ? estados.find((e) => e.idEstado === ciudad.idEstado) ?? null : null;
};

// ---- Fechas: se manejan como "YYYY-MM-DD" para no sufrir desfases por zona horaria ----

export const hoyISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** "2026-03-04T00:00:00" (backend) -> "2026-03-04" */
export const soloFecha = (valor?: string | null): string => (valor ? valor.slice(0, 10) : "");

/** "2026-03-04" -> "2026-03-04T00:00:00" (hora local, sin Z) para el backend. */
export const aFechaBackend = (fecha: string): string => `${fecha}T00:00:00`;

/** Días de la comisión, contando el día de salida y el de regreso. */
export const getDias = (salida: string, regreso: string): number => {
  if (!salida || !regreso) return 1;
  const ms = Date.parse(`${regreso}T00:00:00Z`) - Date.parse(`${salida}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
};

export const formatoFecha = (valor?: string | null): string => {
  const f = soloFecha(valor);
  if (!f) return "";
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
};

export const formatoMoneda = (importe: number): string =>
  importe.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export const folioViatico = (oficina: number, noViat: number, ejercicio: number) => `V${oficina}-${noViat}/${ejercicio}`;
