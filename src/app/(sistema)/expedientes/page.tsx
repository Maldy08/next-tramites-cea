import { auth } from "@/auth";
import { EXPEDIENTES } from "@/modules/expedientes";
import { modulosDisponibles } from "@/modules/registry";
import { BandejaTramites, type TipoBandeja } from "./BandejaTramites";

// Expedientes → Mis Trámites Solicitados: Bandeja de Trámites y Seguimiento (mockup) con los trámites propios
// del ejercicio activo de cada módulo que aporta su expediente (modules/expedientes.ts).
export default async function ExpedientesPage() {
  const session = await auth();
  const tipos: TipoBandeja[] = modulosDisponibles(session?.user?.permisos)
    .filter((m) => EXPEDIENTES[m.id])
    .map(({ id, nombre, icono, color }) => ({ id, nombre, icono, color }));

  return <BandejaTramites tipos={tipos} />;
}
