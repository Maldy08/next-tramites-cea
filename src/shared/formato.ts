// Formato oficial impreso de los trámites de RH (NOM_TRAMITES). Los datos vienen de Oracle por id de trámite
// (VS_TRAMITES_FORMATO + VS_TRAMITES_FORMATO_DET → backend api/NomTramites/{id}/Formato) y son iguales para
// todos los tipos; lo que cambia por tipo (títulos, etiquetas, qué secciones salen) está en CONFIG_FORMATO.
import { TIPO_TRAMITE } from "./tramites";

/** Renglón de VS_TRAMITES_FORMATO. Fechas ISO del backend (con hora). Lo que no aplica al tipo viene null. */
export interface FormatoEncabezado {
  idTramite: number;
  tipoTramite: number;
  descTipo: string | null;
  folio: string;
  ano: number;
  fechaSolicitud: string;
  estatus: number;
  descEstatus: string | null;
  modalidad: string | null;
  noEmp: number;
  nombre: string | null;
  rfc: string | null;
  fechaIngreso: string | null;
  direccion: string | null;
  departamento: string | null;
  puesto: string | null;
  categoria: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaRegreso: string | null;
  dias: number | null;
  /** Vacaciones: saldo total vigente del empleado al consultar (F_SALDO_VACACIONES). */
  saldoTotal: number | null;
  noEmpCubre: number | null;
  nombreCubre: string | null;
  /** Permisos / justificantes: NOM_PERMISOS_JUSTIFICANTES.TIPO_INCIDENCIA, su descripción y JUSTIFICACION_MOTIVO. */
  tipoIncidencia: number | null;
  descIncidencia: string | null;
  motivo: string | null;
  observaciones: string | null;
  firma1NoEmp: number | null;
  firma1Nombre: string | null;
  firma1Puesto: string | null;
  firma2NoEmp: number | null;
  firma2Nombre: string | null;
  firma2Puesto: string | null;
  firma3NoEmp: number | null;
  firma3Nombre: string | null;
  firma3Puesto: string | null;
}

/** Renglón de VS_TRAMITES_FORMATO_DET: columnas genéricas, su significado lo da CONFIG_FORMATO[tipo].detalle. */
export interface FormatoDetalle {
  idTramite: number;
  orden: number;
  concepto1: string | null;
  concepto2: string | null;
  valor1: number | null;
  valor2: number | null;
  valor3: number | null;
}

/** FormatoTramiteDto */
export interface FormatoTramite {
  encabezado: FormatoEncabezado;
  detalle: FormatoDetalle[];
}

/** Columna del desglose: `campo` de FormatoDetalle, encabezado y subtítulo. */
export interface ColumnaDetalle {
  campo: "concepto1" | "concepto2" | "valor1" | "valor2" | "valor3";
  titulo: string;
  sub?: string;
  /** Columna resaltada (lo que pide el trámite). */
  destacada?: boolean;
}

export interface ConfigFormato {
  /** Título grande del encabezado; si falta, "SOLICITUD DE " + DESC_TIPO. */
  titulo: string;
  seccionTramite: string;
  notaTramite: string;
  /** Textos bajo las fechas de inicio y término. */
  notaInicio: string;
  notaFin: string;
  /** Las fechas llevan hora (justificantes). */
  conHora: boolean;
  /** Tarjeta de días; null = no sale. */
  dias: { etiqueta: string; sub: string } | null;
  muestraRegreso: boolean;
  muestraCubre: boolean;
  /** Sección III; null = no sale. Las columnas valor* llevan total en el pie. */
  detalle: { titulo: string; nota: string; columnas: ColumnaDetalle[]; sufijoTotal?: string } | null;
  /** Texto de Observaciones cuando el trámite no trae comentarios. */
  leyenda: string;
}

const LEYENDA_RH =
  "La autorización definitiva queda sujeta a validación de la Coordinación de Recursos Humanos conforme a las Condiciones Generales de Trabajo vigentes en la CEABC.";

/** Formato genérico para tipos sin configuración propia todavía. */
const GENERICO: ConfigFormato = {
  titulo: "",
  seccionTramite: "II. Datos del Trámite",
  notaTramite: "Periodo solicitado",
  notaInicio: "Primer día de ausencia",
  notaFin: "Último día solicitado",
  conHora: false,
  dias: { etiqueta: "Días", sub: "Solicitados" },
  muestraRegreso: true,
  muestraCubre: true,
  detalle: null,
  leyenda: LEYENDA_RH,
};

export const CONFIG_FORMATO: Record<number, ConfigFormato> = {
  [TIPO_TRAMITE.vacaciones]: {
    titulo: "Solicitud de Vacaciones",
    seccionTramite: "II. Datos del Trámite de Vacaciones",
    notaTramite: "Periodo de ausencia y cobertura operativa",
    notaInicio: "Primer día de ausencia",
    notaFin: "Último día solicitado",
    conHora: false,
    dias: { etiqueta: "Días hábiles", sub: "Correspondientes" },
    muestraRegreso: true,
    muestraCubre: true,
    detalle: {
      titulo: "III. Desglose de Periodos Vacacionales del Rango Solicitado",
      nota: "Afectación de saldos",
      columnas: [
        { campo: "concepto1", titulo: "Año / Ciclo" },
        { campo: "concepto2", titulo: "Periodo vacacional" },
        { campo: "valor1", titulo: "Días por disfrutar", sub: "(Saldo anterior)" },
        { campo: "valor2", titulo: "Días solicitados", sub: "(En este trámite)", destacada: true },
        { campo: "valor3", titulo: "Días restantes", sub: "(Saldo final)" },
      ],
      sufijoTotal: "DÍAS",
    },
    leyenda: `La aplicación de saldos vacacionales queda sujeta a validación de la Coordinación de Recursos Humanos conforme a las Condiciones Generales de Trabajo vigentes en la CEABC.`,
  },
  [TIPO_TRAMITE.permisos]: {
    titulo: "Solicitud de Permiso",
    seccionTramite: "II. Datos del Permiso",
    notaTramite: "Periodo de ausencia y cobertura operativa",
    notaInicio: "Primer día de ausencia",
    notaFin: "Último día solicitado",
    conHora: false,
    dias: { etiqueta: "Días hábiles", sub: "Solicitados" },
    muestraRegreso: false,
    muestraCubre: true,
    detalle: null,
    leyenda: LEYENDA_RH,
  },
  [TIPO_TRAMITE.justificantes]: {
    titulo: "Justificante de Incidencia",
    seccionTramite: "II. Datos de la Incidencia",
    notaTramite: "Fecha y hora a justificar",
    notaInicio: "Inicio de la incidencia",
    notaFin: "Fin de la incidencia",
    conHora: true,
    dias: null,
    muestraRegreso: false,
    muestraCubre: false,
    detalle: null,
    leyenda: LEYENDA_RH,
  },
};

export const configFormato = (tipo: number): ConfigFormato => CONFIG_FORMATO[tipo] ?? GENERICO;
