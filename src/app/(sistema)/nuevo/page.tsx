import Link from "next/link";
import { IoArrowBackOutline } from "react-icons/io5";
import { auth } from "@/auth";
import { CAPTURAS } from "@/modules/capturas";
import { modulosDisponibles } from "@/modules/registry";
import { EjercicioActivo } from "@/shared/components/EjercicioActivo";
import { hoySysdate } from "@/shared/fechas";
import { GenerarTramite, type TipoTramite } from "./GenerarTramite";

// Generar Nuevo Trámite (mockup): para quién, tipo de trámite y la captura del módulo elegido.
// ?tipo=<id> llega desde el Catálogo del Tablero con el tipo ya seleccionado.
export default async function NuevoTramitePage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const session = await auth();
  const { tipo } = await searchParams;
  const u = session?.user;
  const tipos: TipoTramite[] = modulosDisponibles(u?.permisos)
    .filter((m) => CAPTURAS[m.id])
    .map(({ id, nombre, icono, color }) => ({ id, nombre, icono, color }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <EjercicioActivo />
            <span className="text-xs text-slate-400">
              Fecha del trámite: <strong className="text-slate-700">{hoySysdate()}</strong>
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Generar Solicitud de Trámite</h1>
          <p className="text-xs text-slate-500">El número consecutivo se generará y mostrará una vez guardada la solicitud.</p>
        </div>
        <Link
          href="/"
          prefetch={false}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:text-slate-900 sm:self-auto"
        >
          <IoArrowBackOutline /> Regresar
        </Link>
      </div>

      <GenerarTramite
        tipos={tipos}
        tipoInicial={tipo}
        nombre={u?.nombrecompleto ?? ""}
        noEmpleado={u?.idUsuario}
        departamento={u?.deptoDescripcion}
        tramitesNivel={u?.tramitesNivel}
      />
    </div>
  );
}
