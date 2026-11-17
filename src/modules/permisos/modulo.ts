import type { ModuloTramite } from "@/shared/modulos";

export const permisosModulo: ModuloTramite = {
  id: "permisos",
  nombre: "Permisos",
  descripcion: "Permiso con o sin goce de sueldo por uno o varios días hábiles, con relevo opcional.",
  ruta: "/permisos",
  icono: "documento",
  color: "azul",
  accionesRapidas: [{ label: "Solicitar permiso", ruta: "/nuevo?tipo=permisos", icono: "capturar", principal: true }],
  // Igual que vacaciones: todo usuario para sí mismo y el supervisor para su gente (puedeOperarEmpleado).
  nivelDesdeLogin: () => 0,
};
