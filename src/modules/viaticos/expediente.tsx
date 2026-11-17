"use client";

// Viáticos en la Bandeja de Trámites (/expedientes): convierte el listado del empleado a FilaExpediente.
import type { ExpedienteModulo, TonoEstatus } from "@/shared/expedientes";
import { BotonEditar } from "./components/ListadoViaticos";
import { MenuFormatos } from "./components/MenuFormatos";
import { getViaticosByEmpleado } from "./data-access";
import { ESTATUS_CANCELADO, ESTATUS_VIATICO, folioViatico, formatoFecha, soloFecha } from "./lib/reglas";

const TONOS: Record<string, TonoEstatus> = { "1": "info", "2": "alerta", "3": "violeta", "4": "exito", "9": "peligro" };

export const expedienteViaticos: ExpedienteModulo = {
  cargar: async (ejercicio, empleado) => {
    const lista = await getViaticosByEmpleado(ejercicio, empleado.id);
    return (lista ?? []).map((v) => {
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
            <MenuFormatos
              ejercicio={v.ejercicio}
              oficina={v.oficina}
              noViat={v.viatico}
              disabled={Number(v.estatus) === ESTATUS_CANCELADO}
            />
            <BotonEditar v={v} />
          </>
        ),
      };
    });
  },
};
