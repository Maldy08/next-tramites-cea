"use client";

import type { CapturaTramite } from "@/shared/modulos";
import { CapturaViatico } from "./CapturaViatico";

/** Paso 3 de Generar Nuevo Trámite (/nuevo) cuando el tipo es Viáticos. */
export const CapturaTramiteViatico: CapturaTramite = ({ empleado }) => <CapturaViatico empleadoId={empleado} />;
