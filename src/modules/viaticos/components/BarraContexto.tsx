"use client";

import { IoPersonOutline, IoSwapHorizontalOutline } from "react-icons/io5";
import { useEmpleadoActivo } from "@/modules/viaticos/lib/useEmpleadoActivo";
import { useViaticosStore } from "@/modules/viaticos/store/useViaticosStore";

/**
 * Empleado activo para el nivel 9 (captura/consulta a nombre de empleados de su departamento).
 * El ejercicio ya no va aquí: es global (header y sidebar).
 */
export const BarraContexto = () => {
  const setModalEmpleadosAbierto = useViaticosStore((s) => s.setModalEmpleadosAbierto);
  const empleado = useEmpleadoActivo();

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
        <IoPersonOutline className="h-4 w-4 shrink-0 text-primary-800" />
        <span className="text-xs font-semibold uppercase tracking-wide">Empleado activo</span>
        <span className="truncate font-semibold text-slate-900">
          {empleado.id} {empleado.nombre}
          {!empleado.esOtro && <span className="font-normal text-slate-400"> (yo)</span>}
        </span>
      </span>
      <button
        type="button"
        onClick={() => setModalEmpleadosAbierto(true)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-800 hover:bg-primary-50"
      >
        <IoSwapHorizontalOutline className="h-4 w-4" /> Cambiar de empleado
      </button>
    </div>
  );
};
