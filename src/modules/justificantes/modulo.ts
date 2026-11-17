import type { ModuloTramite } from "@/shared/modulos";

export const justificantesModulo: ModuloTramite = {
  id: "justificantes",
  nombre: "Justificantes",
  descripcion: "Justificación de entrada, salida o checadas omitidas en el reloj, con fecha y hora de la incidencia.",
  ruta: "/justificantes",
  icono: "documento",
  color: "ambar",
  accionesRapidas: [{ label: "Justificar incidencia", ruta: "/nuevo?tipo=justificantes", icono: "capturar", principal: true }],
  // Igual que vacaciones y permisos: todo usuario para sí mismo y el supervisor para su gente (puedeOperarEmpleado).
  nivelDesdeLogin: () => 0,
};
