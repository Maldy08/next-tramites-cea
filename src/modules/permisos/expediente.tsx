"use client";

// Permisos en la Bandeja de Trámites (/expedientes): trámites NOM_TRAMITES tipo 3 como FilaExpediente.
// Los del personal a cargo y los capturados para otros (supervisor nivel 2) llegan en una sola consulta.
import { IoPrintOutline } from "react-icons/io5";
import type { EmpleadoExpediente, ExpedienteModulo, FilaExpediente } from "@/shared/expedientes";
import { getTramitesCapturados, getTramitesPersonal } from "@/shared/personal";
import { estatusTramite, TIPO_TRAMITE, type Tramite } from "@/shared/tramites";
import { AccionesSolicitud } from "./components/AccionesSolicitud";
import { getSolicitudes } from "./data-access";

const fila = (t: Tramite, empleado: EmpleadoExpediente, recargar: () => void): FilaExpediente => ({
  clave: String(t.idTramite),
  folio: t.folio,
  fecha: t.fechaSolicitud.slice(0, 10),
  titulo: "Solicitud de permiso",
  beneficiario: { nombre: empleado.nombre, numero: empleado.id },
  estatus: estatusTramite(t.estatus),
  acciones: (
    <>
      <a
        href={`/formato/${t.idTramite}`}
        target="_blank"
        rel="noopener"
        title="Ver e imprimir el formato oficial"
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <IoPrintOutline className="h-4 w-4" /> Formato
      </a>
      <AccionesSolicitud idTramite={t.idTramite} folio={t.folio} estatus={t.estatus} alCambiar={recargar} />
    </>
  ),
});

export const expedientePermisos: ExpedienteModulo = {
  cargar: async (ejercicio, empleado, recargar) =>
    ((await getSolicitudes(empleado.id, ejercicio)) ?? []).map((t) => fila(t, empleado, recargar)),
  cargarPersonal: async (ejercicio, personal, recargar) =>
    (await getTramitesPersonal(ejercicio, TIPO_TRAMITE.permisos, personal)).map(({ tramite, empleado }) => fila(tramite, empleado, recargar)),
  cargarCapturados: async (ejercicio, recargar) =>
    (await getTramitesCapturados(ejercicio, TIPO_TRAMITE.permisos)).map(({ tramite, empleado }) => fila(tramite, empleado, recargar)),
};
