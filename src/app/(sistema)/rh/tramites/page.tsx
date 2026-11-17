import { AdministracionTramites } from "@/modules/rh/components/AdministracionTramites";

// Expedientes Institucionales CEA (Mesa Control RH): solo TRAMITES_NIVEL 9 (lo exige proxy.ts y las APIs).
export default function TramitesRhPage() {
  return <AdministracionTramites />;
}
