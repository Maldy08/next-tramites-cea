// DTOs de la Bandeja de Firmas (backend CEA api/NomTramitesFirmas). Solo TRAMITES_NIVEL 3 (jefes y directores).
import type { Tramite } from "@/shared/tramites";

/** TramiteRhDto: trámite que espera la firma del usuario. Fechas ISO con hora. */
export interface TramitePorFirmar extends Tramite {
  nombreEmpleado: string | null;
  descripcionDepto: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  tipoIncidencia: number | null;
}

/** POST /api/firmas/tramite/[idTramite]. Regresar exige comentarios (motivo). */
export interface AccionFirma {
  accion: "firmar" | "regresar";
  comentarios?: string | null;
}
