"use client";

import Link from "next/link";
import { IoArrowBackOutline, IoPrintOutline } from "react-icons/io5";

/** Barra superior del formato impreso (no sale en la impresión). */
export const BarraFormato = ({ folio }: { folio: string }) => (
  <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900 px-4 py-2.5 text-white shadow-md print:hidden">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/expedientes"
          className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium hover:bg-slate-700"
        >
          <IoArrowBackOutline className="h-4 w-4" /> Bandeja
        </Link>
        <div>
          <h1 className="text-sm font-bold leading-tight">Formato oficial · {folio}</h1>
          <p className="text-[11px] text-slate-400">Hoja carta vertical. En el diálogo de impresión elija «Guardar como PDF» si lo requiere.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded bg-[#691c32] px-4 py-1.5 text-xs font-bold shadow hover:bg-[#4f1526]"
      >
        <IoPrintOutline className="h-4 w-4" /> Imprimir / PDF
      </button>
    </div>
  </header>
);
