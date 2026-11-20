import { BandejaFirmas } from "@/modules/firmas/components/BandejaFirmas";

// Trámites por Firmar: solo TRAMITES_NIVEL 3 (jefes y directores; lo exigen proxy.ts y las APIs).
export default function FirmasPage() {
  return <BandejaFirmas />;
}
