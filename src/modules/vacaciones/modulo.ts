import type { ModuloTramite } from "@/shared/modulos";

export const vacacionesModulo: ModuloTramite = {
  id: "vacaciones",
  nombre: "Vacaciones",
  descripcion: "1er y 2do periodo, días por periodo, saldo restante automático y relevo opcional.",
  ruta: "/vacaciones",
  icono: "vacaciones",
  color: "esmeralda",
  accionesRapidas: [{ label: "Programar periodo", ruta: "/nuevo?tipo=vacaciones", icono: "capturar", principal: true }],
  // Todo usuario del portal consulta y programa sus propias vacaciones; el supervisor, además, las de su gente
  // (shared/server/empleados.ts → puedeOperarEmpleado). Sin nivel propio por ahora.
  nivelDesdeLogin: () => 0,
};
