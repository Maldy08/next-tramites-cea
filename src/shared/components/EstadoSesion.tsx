"use client";

import { useEffect } from "react";
import { hidratarEjercicio } from "@/shared/store/useEjercicioStore";

/** Carga el estado de trabajo común (ejercicio) de sessionStorage una vez montada la app. */
export const EstadoSesion = ({ userId }: { userId?: number }) => {
  useEffect(() => {
    hidratarEjercicio(userId ?? null);
  }, [userId]);
  return null;
};
