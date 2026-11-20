import { SaldosVacaciones } from "@/modules/rh/components/SaldosVacaciones";

// Saldos de vacaciones (punto de partida de F_SALDO_VACACIONES): solo TRAMITES_NIVEL 9 (proxy.ts y las APIs).
export default function SaldosRhPage() {
  return <SaldosVacaciones />;
}
