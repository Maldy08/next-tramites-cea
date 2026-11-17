import Link from "next/link";
import { IoAlertCircleOutline, IoArrowForwardOutline, IoPerson, IoTimeOutline } from "react-icons/io5";
import { auth } from "@/auth";
import { MODULOS, modulosDisponibles } from "@/modules/registry";
import { EjercicioActivo } from "@/shared/components/EjercicioActivo";
import { Icono } from "@/shared/components/Iconos";
import { COLORES_MODULO } from "@/shared/components/coloresModulo";
import { hoySysdate } from "@/shared/fechas";

/** "CARLOS ALBERTO MALDONADO VERDÍN" → "Carlos" (el nombre completo viene como nombre + apellidos). */
const primerNombre = (nombreCompleto?: string) => {
  const n = nombreCompleto?.trim().split(/\s+/)[0] ?? "";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
};

// Tablero Principal (como el mockup): saludo y Catálogo Oficial de Trámites de Personal. Cada tarjeta abre
// Generar Nuevo Trámite con ese tipo ya elegido (/nuevo?tipo=<id>).
export default async function TableroPage({ searchParams }: { searchParams: Promise<{ sinAcceso?: string }> }) {
  const session = await auth();
  const { sinAcceso } = await searchParams;
  const nombre = primerNombre(session?.user?.nombrecompleto);
  const moduloNegado = sinAcceso ? MODULOS.find((m) => m.id === sinAcceso) : undefined;
  const tramites = modulosDisponibles(session?.user?.permisos).flatMap((m) =>
    m.accionesRapidas.filter((a) => a.principal).map((accion) => ({ m, accion }))
  );

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <section className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <EjercicioActivo activo />
            <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-400">
              <IoTimeOutline /> Sysdate: {hoySysdate()}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {nombre ? `Hola, ${nombre}. ` : ""}¿Qué trámite deseas gestionar hoy?
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Gestiona tus solicitudes personales o tramita por representación de los operarios de campo adscritos a tu
            departamento que no cuentan con equipo de cómputo.
          </p>
        </div>
        <Link
          href="/nuevo"
          prefetch={false}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 sm:w-auto"
        >
          <IoPerson className="text-secondary-300" />
          Mi Trámite Personal
        </Link>
      </section>

      {moduloNegado && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <IoAlertCircleOutline className="mt-0.5 h-5 w-5 shrink-0" />
          No tienes acceso al módulo de {moduloNegado.nombre}. Si lo necesitas, solicítalo al área de Informática.
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Catálogo Oficial de Trámites de Personal</h2>
            <p className="text-xs text-slate-500">Selecciona el tipo de trámite para iniciar la solicitud</p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {tramites.length} {tramites.length === 1 ? "Tipo Disponible" : "Tipos Disponibles"}
          </span>
        </div>

        {tramites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
            Tu usuario no tiene trámites asignados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tramites.map(({ m, accion }) => {
              const c = COLORES_MODULO[m.color].catalogo;
              return (
                <Link
                  key={accion.ruta}
                  href={`/nuevo?tipo=${m.id}`}
                  prefetch={false}
                  className={`group flex flex-col justify-between rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 transition-all hover:bg-white hover:shadow-lg ${c.borde}`}
                >
                  <div>
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-transform group-hover:scale-110 ${c.icono}`}
                    >
                      <Icono nombre={m.icono} />
                    </span>
                    <h3 className={`mt-4 text-base font-bold text-slate-900 transition-colors ${c.textoHover}`}>{m.nombre}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{m.descripcion}</p>
                  </div>
                  <div
                    className={`mt-5 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs font-bold ${c.texto}`}
                  >
                    <span>Iniciar Trámite</span>
                    <IoArrowForwardOutline className="transition-transform group-hover:translate-x-1.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
