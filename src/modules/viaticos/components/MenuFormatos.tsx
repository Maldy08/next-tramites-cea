"use client";

import { useEffect, useRef, useState } from "react";
import { IoChevronDownOutline, IoDocumentTextOutline } from "react-icons/io5";
import type { FormatoViatico } from "@/modules/viaticos/dtos";
import { urlFormato } from "@/modules/viaticos/data-access";

const FORMATOS: { formato: FormatoViatico; label: string }[] = [
  { formato: "TresFormatos", label: "Formato completo" },
  { formato: "FormatoComision", label: "Formato de comisión" },
  { formato: "ReciboViatico", label: "Recibo de viático" },
  { formato: "InformeActividades", label: "Informe de actividades" },
];

interface Props {
  ejercicio: number;
  oficina: number;
  noViat: number;
  disabled?: boolean;
}

/** Menú de PDFs. Usa position:fixed para que no lo recorte el scroll horizontal de la tabla. */
export const MenuFormatos = ({ ejercicio, oficina, noViat, disabled }: Props) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const cerrar = (e: Event) => {
      if (e.type === "mousedown" && (menu.current?.contains(e.target as Node) || boton.current?.contains(e.target as Node))) return;
      setPos(null);
    };
    document.addEventListener("mousedown", cerrar);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = boton.current!.getBoundingClientRect();
    const ancho = 208;
    setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.right - ancho, window.innerWidth - ancho - 8)) });
  };

  const abrir = (formato: FormatoViatico) => {
    window.open(urlFormato(formato, ejercicio, oficina, noViat), "_blank", "noopener");
    setPos(null);
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={disabled ? "Viático cancelado" : "Imprimir formatos"}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-800 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IoDocumentTextOutline className="h-4 w-4" /> Formatos
        <IoChevronDownOutline className={`h-3 w-3 transition ${pos ? "rotate-180" : ""}`} />
      </button>
      {pos && (
        <div
          ref={menu}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg animate-openmodal"
        >
          {FORMATOS.map(({ formato, label }) => (
            <button
              key={formato}
              onClick={() => abrir(formato)}
              className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-900"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
