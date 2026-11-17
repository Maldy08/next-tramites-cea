// Lo que cada módulo aporta a la Bandeja de Trámites (/expedientes → Mis Trámites Solicitados):
// sus trámites del empleado convertidos a FilaExpediente (shared/expedientes.ts).
// Va aparte de registry.ts por lo mismo que capturas.ts (registry no debe cargar React).
import type { ExpedienteModulo } from "@/shared/expedientes";
import { expedienteJustificantes } from "./justificantes/expediente";
import { expedientePermisos } from "./permisos/expediente";
import { expedienteVacaciones } from "./vacaciones/expediente";
import { expedienteViaticos } from "./viaticos/expediente";

export const EXPEDIENTES: Record<string, ExpedienteModulo> = {
  viaticos: expedienteViaticos,
  vacaciones: expedienteVacaciones,
  permisos: expedientePermisos,
  justificantes: expedienteJustificantes,
};
