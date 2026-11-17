"use client";

import { signOut } from "next-auth/react";
import { IoLogOutOutline } from "react-icons/io5";

interface LogoutButtonProps {
  variant?: "light" | "sidebar";
}

export const LogoutButton = ({ variant = "light" }: LogoutButtonProps) => {
  const styles =
    variant === "sidebar"
      ? "justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-primary-900/70 hover:text-white"
      : "rounded-lg text-sm font-medium text-red-600 hover:bg-red-50";

  const salir = () => {
    // Los módulos guardan su estado de trabajo (ejercicio, empleado activo, ...) en sessionStorage.
    try {
      sessionStorage.clear();
    } catch {
      // sin acceso a sessionStorage: no hay nada que limpiar
    }
    signOut({ callbackUrl: "/login" });
  };

  return (
    <button onClick={salir} className={`flex w-full items-center gap-2.5 px-3 py-2 transition ${styles}`}>
      <IoLogOutOutline className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
};
