import type { ModuloTramite } from "@/shared/modulos";

export const viaticosModulo: ModuloTramite = {
  id: "viaticos",
  nombre: "Viáticos",
  descripcion: "Captura, consulta e impresión de viáticos y formatos de comisión.",
  ruta: "/viaticos",
  icono: "viaticos",
  color: "vino",
  accionesRapidas: [
    { label: "Capturar viático", ruta: "/viaticos/capturar", icono: "capturar", principal: true },
    { label: "Mis viáticos", ruta: "/viaticos/listado", icono: "listado" },
  ],
  // Igual que el sistema anterior: todo usuario puede capturar sus propios viáticos.
  // viaticosNivel 9 = puede trabajar los de su departamento (ver lib/reglas.ts).
  nivelDesdeLogin: (u) => u.viaticosNivel ?? 0,
};
