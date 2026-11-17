"use client";

import { IoCalendarOutline } from "react-icons/io5";
import { useEjercicioStore } from "@/shared/store/useEjercicioStore";

/**
 * Etiqueta de solo lectura con el ejercicio fiscal global.
 * `activo`: versión del saludo del Tablero (mockup): "Ejercicio Fiscal Activo: 2026", sin ícono.
 */
export const EjercicioActivo = ({ activo = false }: { activo?: boolean }) => {
  const ejercicio = useEjercicioStore((s) => s.ejercicio);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-900">
      {!activo && <IoCalendarOutline className="h-3.5 w-3.5" />}
      {activo ? "Ejercicio Fiscal Activo:" : "Ejercicio fiscal"} <span className="font-mono font-black">{ejercicio}</span>
    </span>
  );
};
