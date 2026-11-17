"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { IoCloseOutline, IoSearchOutline } from "react-icons/io5";
import type { Empleado } from "@/modules/viaticos/dtos";
import { getEmpleadosDepartamento } from "@/modules/viaticos/data-access";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { useViaticosStore } from "@/modules/viaticos/store/useViaticosStore";
import { toast } from "@/shared/store/useToast";

const normalizar = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const nombreDe = (e: Empleado) => e.nombreCompleto || `${e.nombre} ${e.paterno} ${e.materno}`.trim();

/** Selector de empleado del departamento (solo nivel 9), equivalente al "Cambiar de empleado" anterior. */
export const ModalEmpleados = () => {
  const { data: session } = useSession();
  const { modalEmpleadosAbierto, setModalEmpleadosAbierto, empleadoSeleccionado, setEmpleadoSeleccionado } =
    useViaticosStore();
  const [empleados, setEmpleados] = useState<Empleado[] | null>(null);
  const [filtro, setFiltro] = useState("");

  const miId = session?.user?.idUsuario;
  const activoId = empleadoSeleccionado?.id ?? miId;

  useEffect(() => {
    if (!modalEmpleadosAbierto || empleados) return;
    getEmpleadosDepartamento()
      .then(setEmpleados)
      .catch((e: Error) => {
        toast.error(e.message || "No fue posible cargar el listado de empleados.");
        setEmpleados([]);
      });
  }, [modalEmpleadosAbierto, empleados]);

  useEffect(() => {
    if (!modalEmpleadosAbierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalEmpleadosAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalEmpleadosAbierto, setModalEmpleadosAbierto]);

  const filtrados = useMemo(() => {
    const q = normalizar(filtro.trim());
    const lista = empleados ?? [];
    if (!q) return lista;
    return lista.filter((e) => String(e.empleado).includes(q) || normalizar(nombreDe(e)).includes(q));
  }, [empleados, filtro]);

  if (!modalEmpleadosAbierto) return null;

  const cerrar = () => {
    setModalEmpleadosAbierto(false);
    setFiltro("");
  };

  const seleccionar = (e: Empleado) => {
    setEmpleadoSeleccionado(e.empleado === miId ? null : { id: e.empleado, nombre: nombreDe(e) });
    toast.info(`Empleado activo: ${e.empleado} - ${nombreDe(e)}`);
    cerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 animate-openmodal" onClick={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-empleados"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="titulo-empleados" className="text-lg font-bold text-slate-900">
              Cambiar de empleado
            </h2>
            <p className="text-xs text-slate-500">
              {empleados ? `${filtrados.length} empleado(s) de tu departamento` : "Cargando listado…"}
            </p>
          </div>
          <button onClick={cerrar} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <IoCloseOutline className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Filtrar por número o nombre…"
              className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!empleados ? (
            <LoadingSpinner />
          ) : filtrados.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No hay resultados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtrados.map((e) => {
                const activo = e.empleado === activoId;
                return (
                  <li key={e.empleado}>
                    <button
                      onClick={() => seleccionar(e)}
                      className={`flex w-full items-center gap-4 px-5 py-2.5 text-left text-sm transition hover:bg-primary-50 ${
                        activo ? "bg-primary-50" : ""
                      }`}
                    >
                      <span className="w-16 shrink-0 font-mono font-semibold text-slate-600">{e.empleado}</span>
                      <span className="min-w-0 flex-1 break-words text-slate-800">{nombreDe(e)}</span>
                      {e.empleado === miId && <span className="text-xs text-slate-400">(yo)</span>}
                      {activo && (
                        <span className="rounded-full bg-primary-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          Activo
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
