"use client";

import Link from "next/link";
import { IoArrowForwardOutline, IoCreateOutline, IoFolderOpenOutline } from "react-icons/io5";
import { useEjercicioStore } from "@/shared/store/useEjercicioStore";

const ACCESOS = [
  {
    href: "/viaticos/capturar",
    icon: IoCreateOutline,
    titulo: "Capturar viático",
    texto: "Registra una nueva solicitud de viáticos.",
  },
  {
    href: "/viaticos/listado",
    icon: IoFolderOpenOutline,
    titulo: "Consultar viáticos",
    texto: "Consulta, modifica e imprime los formatos de tus viáticos.",
  },
];

export const InicioViaticos = ({ nombre }: { nombre: string }) => {
  const ejercicio = useEjercicioStore((s) => s.ejercicio);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-800">Menú principal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Sistema de Control de Viáticos</h1>
          <p className="mt-1 break-words text-sm text-slate-600">Bienvenido(a), {nombre}.</p>
        </div>
        <div className="shrink-0 rounded-lg bg-primary-950 px-5 py-3 text-center text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ejercicio</p>
          <p className="text-2xl font-bold">{ejercicio}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Accesos principales">
        {ACCESOS.map(({ href, icon: Icon, titulo, texto }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md"
          >
            <span className="rounded-lg bg-primary-50 p-3 text-2xl text-primary-800 transition group-hover:bg-primary-900 group-hover:text-white">
              <Icon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                {titulo}
                <IoArrowForwardOutline className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-sm text-slate-600">{texto}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
};
