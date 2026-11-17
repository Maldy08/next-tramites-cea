"use client";

import { IoMenuOutline } from "react-icons/io5";
import { useUiStore } from "@/shared/store/useUiStore";

/** Abre el sidebar en móvil/tablet. */
export const BotonMenu = () => {
  const setSidebarAbierto = useUiStore((s) => s.setSidebarAbierto);
  return (
    <button
      onClick={() => setSidebarAbierto(true)}
      aria-label="Abrir menú"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg text-white transition-all hover:bg-white/20 active:scale-95 lg:hidden"
    >
      <IoMenuOutline className="h-5 w-5" />
    </button>
  );
};
