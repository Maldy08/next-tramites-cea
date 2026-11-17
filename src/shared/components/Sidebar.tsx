"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoAddCircleOutline, IoCloseOutline, IoFileTrayFullOutline, IoLibraryOutline, IoSpeedometerOutline } from "react-icons/io5";
import { useUiStore } from "@/shared/store/useUiStore";
import { LogoutButton } from "./LogoutButton";
import { SelectorEjercicio } from "./SelectorEjercicio";

interface SidebarItemProps {
  href: string;
  icono: React.ReactNode;
  /** Color del ícono cuando la opción no está activa. */
  colorIcono?: string;
  label: string;
  exact?: boolean;
  /** Otras rutas (y sus subrutas) en las que la opción también se marca activa. */
  activoEn?: string[];
  onNavigate?: () => void;
}

const coincide = (pathname: string, ruta: string) => pathname === ruta || pathname.startsWith(ruta + "/");

const SidebarItem = ({ href, icono, colorIcono = "text-slate-400", label, exact, activoEn = [], onNavigate }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = (exact ? pathname === href : coincide(pathname, href)) || activoEn.some((r) => coincide(pathname, r));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
        isActive
          ? "bg-primary-900 font-bold text-white shadow-sm shadow-black/20"
          : "font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className={`w-5 shrink-0 text-center text-lg ${isActive ? "text-secondary-200" : colorIcono}`}>{icono}</span>
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
};

const Seccion = ({ nombre, primera }: { nombre: string; primera?: boolean }) => (
  <p className={`px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ${primera ? "pt-2" : "pt-4"}`}>
    {nombre}
  </p>
);

/**
 * Menú lateral del sistema (perfil Empleado del mockup): Tablero, Generar Nuevo Trámite y Expedientes.
 * `rutasNuevoTramite` = acciones principales de los módulos (modules/registry), para marcar "Generar" activo en ellas.
 * `administradorRh` (TRAMITES_NIVEL 9) agrega "Expedientes Institucionales CEA" (perfil Mesa Control RH del mockup).
 */
export const Sidebar = ({ rutasNuevoTramite, administradorRh = false }: { rutasNuevoTramite: string[]; administradorRh?: boolean }) => {
  const { sidebarAbierto, setSidebarAbierto } = useUiStore();
  const cerrar = () => setSidebarAbierto(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarAbierto(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarAbierto]);

  return (
    <>
      {sidebarAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrar}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900 text-white shadow-2xl transition-transform duration-300
          ${sidebarAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Marca */}
        <div className="relative flex shrink-0 flex-col items-center border-b border-slate-800 bg-slate-950 px-5 py-4">
          <Image src="/logo-blanco.png" alt="Comisión Estatal del Agua" width={150} height={64} priority />
          <button
            onClick={cerrar}
            aria-label="Cerrar menú"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
          >
            <IoCloseOutline className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <Seccion nombre="Módulos" primera />
          <SidebarItem href="/" exact icono={<IoSpeedometerOutline />} label="Tablero Principal" onNavigate={cerrar} />
          <SidebarItem
            href="/nuevo"
            icono={<IoAddCircleOutline />}
            colorIcono="text-emerald-400"
            label="Generar Nuevo Trámite"
            activoEn={rutasNuevoTramite}
            onNavigate={cerrar}
          />

          <Seccion nombre="Expedientes" />
          <SidebarItem href="/expedientes" icono={<IoFileTrayFullOutline />} label="Mis Trámites Solicitados" onNavigate={cerrar} />
          {administradorRh && (
            <SidebarItem
              href="/rh/tramites"
              icono={<IoLibraryOutline />}
              colorIcono="text-rose-400"
              label="Expedientes Institucionales CEA"
              onNavigate={cerrar}
            />
          )}
        </nav>

        {/* Pie: ejercicio y salida */}
        <div className="shrink-0 space-y-2 border-t border-slate-800 bg-slate-950 p-4">
          <SelectorEjercicio variante="sidebar" />
          <LogoutButton variant="sidebar" />
        </div>
      </aside>
    </>
  );
};
