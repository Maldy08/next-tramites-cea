// Tarjetas de resumen que cada módulo aporta al portal (/).
// Va aparte de registry.ts porque registry lo importan auth.ts y proxy.ts, que no deben cargar React.
import type { ComponentType } from "react";
import { ResumenViaticos } from "./viaticos/components/ResumenViaticos";

export const RESUMENES: Record<string, ComponentType> = {
  viaticos: ResumenViaticos,
};
