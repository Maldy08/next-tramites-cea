"use client";

import { useEffect, useRef, useState } from "react";
import { IoChevronDownOutline } from "react-icons/io5";
import { LogoutButton } from "./LogoutButton";

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("") || "?";

interface Props {
  /** Login del usuario. */
  user: string;
  nombre: string;
  puesto: string;
  departamento: string;
}

/** Nombre, puesto y avatar del header (fondo vino); al pulsar, ficha del usuario y cerrar sesión. */
export const ButtonHeader = ({ user, nombre, puesto, departamento }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const avatar = iniciales(nombre || user);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left">
        <span className="hidden min-w-0 text-right sm:block">
          <span className="block max-w-[220px] truncate text-xs font-bold leading-tight text-white">{nombre || user}</span>
          {puesto && <span className="block max-w-[220px] truncate text-[10px] text-secondary-200">{puesto}</span>}
        </span>
        <span className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full border border-white bg-secondary-500 text-xs font-black text-slate-900 shadow-sm">
          {avatar}
        </span>
        <IoChevronDownOutline className={`hidden h-3.5 w-3.5 text-white/70 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-openmodal">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-secondary-500 text-sm font-black text-slate-900">
              {avatar}
            </span>
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-slate-800">{nombre}</p>
              {puesto && <p className="break-words text-xs text-slate-500">{puesto}</p>}
              {departamento && (
                <p className="break-words text-[10px] font-bold uppercase tracking-wide text-primary-800">{departamento}</p>
              )}
              <p className="truncate font-mono text-[11px] text-slate-400">{user}</p>
            </div>
          </div>
          <div className="p-2">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
};
