"use client";

import { useEffect, useRef, useState } from "react";
import { IoCalendarOutline, IoCheckmarkOutline, IoChevronDownOutline } from "react-icons/io5";
import { ejercicioActual, ejerciciosDisponibles, useEjercicioStore } from "@/shared/store/useEjercicioStore";
import { toast } from "@/shared/store/useToast";

interface Props {
  /** "sidebar": botón ancho al pie del menú. "pill": etiqueta compacta del header. */
  variante: "sidebar" | "pill";
}

/** Selector del ejercicio fiscal global (actual o anterior). */
export const SelectorEjercicio = ({ variante }: Props) => {
  const { ejercicio, setEjercicio } = useEjercicioStore();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  const elegir = (anio: number) => {
    setAbierto(false);
    if (anio === ejercicio) return;
    setEjercicio(anio);
    toast.info(`Ejercicio fiscal ${anio}`);
  };

  const boton =
    variante === "sidebar" ? (
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <IoCalendarOutline className="h-4 w-4 text-secondary-300" /> Ejercicio fiscal
        </span>
        <span className="font-mono font-bold text-secondary-200">{ejercicio}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        title="Cambiar ejercicio fiscal"
        className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[11px] text-secondary-200 transition-colors hover:bg-black/50"
      >
        <IoCalendarOutline className="h-3 w-3" />
        {ejercicio}
        <IoChevronDownOutline className={`h-3 w-3 transition ${abierto ? "rotate-180" : ""}`} />
      </button>
    );

  return (
    <div ref={ref} className="relative">
      {boton}
      {abierto && (
        <div
          className={`absolute z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl animate-openmodal ${
            variante === "sidebar" ? "bottom-full left-0 mb-2" : "left-0 top-full mt-2"
          }`}
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ejercicio fiscal</p>
          {ejerciciosDisponibles().map((anio) => (
            <button
              key={anio}
              type="button"
              onClick={() => elegir(anio)}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-primary-50 ${
                anio === ejercicio ? "font-bold text-primary-900" : ""
              }`}
            >
              <span>
                {anio}
                {anio === ejercicioActual() && <span className="ml-1.5 text-xs font-normal text-slate-400">(actual)</span>}
              </span>
              {anio === ejercicio && <IoCheckmarkOutline className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
