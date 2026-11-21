"use client";

// Viáticos en la Bandeja de Trámites (/expedientes): convierte el listado del empleado a FilaExpediente.
// "Capturados por mí" (supervisor nivel 2): viáticos con NOEMP_CREA = él, leídos del listado de cada empleado.
import type { EmpleadoExpediente, ExpedienteModulo, FilaExpediente, TonoEstatus } from "@/shared/expedientes";
import { BotonEditar } from "./components/ListadoViaticos";
import { MenuFormatos } from "./components/MenuFormatos";
import { getViaticosByEmpleado, getViaticosCapturados } from "./data-access";
import type { ViaticoListado } from "./dtos";
import { ESTATUS_CANCELADO, ESTATUS_VIATICO, folioViatico, formatoFecha, soloFecha } from "./lib/reglas";

const TONOS: Record<string, TonoEstatus> = { "1": "info", "2": "alerta", "3": "violeta", "4": "exito", "9": "peligro" };

const fila = (v: ViaticoListado, empleado: EmpleadoExpediente): FilaExpediente => {
  const estatus = String(v.estatus).trim();
  return {
    clave: `${v.oficina}-${v.viatico}`,
    folio: folioViatico(v.oficina, v.viatico, v.ejercicio),
    fecha: soloFecha(v.fecha),
    titulo: v.motivo,
    detalle: `${v.origen} → ${v.destino} · ${formatoFecha(v.salida)} – ${formatoFecha(v.regreso)}`,
    beneficiario: { nombre: empleado.nombre, numero: empleado.id },
    estatus: { etiqueta: ESTATUS_VIATICO[estatus] ?? (estatus || "—"), tono: TONOS[estatus] ?? "neutro" },
    acciones: (
      <>
        <MenuFormatos ejercicio={v.ejercicio} oficina={v.oficina} noViat={v.viatico} disabled={Number(v.estatus) === ESTATUS_CANCELADO} />
        <BotonEditar v={v} />
      </>
    ),
  };
};

export const expedienteViaticos: ExpedienteModulo = {
  cargar: async (ejercicio, empleado) => ((await getViaticosByEmpleado(ejercicio, empleado.id)) ?? []).map((v) => fila(v, empleado)),
  cargarCapturados: async (ejercicio) => {
    const capturados = (await getViaticosCapturados(ejercicio)) ?? [];
    // Por empleado: su listado (F_LISTAVIATICOSXEMP) filtrado a los viáticos que capturó el supervisor.
    const porEmpleado = new Map<number, { empleado: EmpleadoExpediente; claves: Set<string> }>();
    for (const c of capturados) {
      const grupo = porEmpleado.get(c.noEmp) ?? {
        empleado: { id: c.noEmp, nombre: c.nombreEmpleado || `Empleado ${c.noEmp}` },
        claves: new Set<string>(),
      };
      grupo.claves.add(`${c.oficina}-${c.noViat}`);
      porEmpleado.set(c.noEmp, grupo);
    }
    const listas = await Promise.all(
      [...porEmpleado.values()].map(async ({ empleado, claves }) =>
        ((await getViaticosByEmpleado(ejercicio, empleado.id)) ?? [])
          .filter((v) => claves.has(`${v.oficina}-${v.viatico}`))
          .map((v) => fila(v, empleado))
      )
    );
    return listas.flat();
  },
};
