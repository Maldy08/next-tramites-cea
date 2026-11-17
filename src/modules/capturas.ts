// Captura que cada módulo aporta al paso 3 de Generar Nuevo Trámite (/nuevo): el formulario del trámite para el
// beneficiario elegido en el paso 1 (el usuario o un compañero a su cargo). Un módulo sin captura aquí no aparece
// en "Tipo de Trámite". Va aparte de registry.ts por lo mismo que expedientes.ts (registry no debe cargar React).
import type { CapturaTramite } from "@/shared/modulos";
import { CapturaJustificantes } from "./justificantes/components/CapturaJustificantes";
import { CapturaPermisos } from "./permisos/components/CapturaPermisos";
import { CapturaVacaciones } from "./vacaciones/components/CapturaVacaciones";
import { CapturaTramiteViatico } from "./viaticos/components/CapturaTramiteViatico";

export const CAPTURAS: Record<string, CapturaTramite> = {
  viaticos: CapturaTramiteViatico,
  vacaciones: CapturaVacaciones,
  permisos: CapturaPermisos,
  justificantes: CapturaJustificantes,
};
