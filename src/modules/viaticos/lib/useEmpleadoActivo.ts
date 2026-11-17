"use client";

import { useSession } from "next-auth/react";
import { useViaticosStore } from "../store/useViaticosStore";

/** Empleado con el que se trabaja: el seleccionado por un nivel 9, o el propio usuario. */
export const useEmpleadoActivo = () => {
  const { data: session } = useSession();
  const empleadoSeleccionado = useViaticosStore((s) => s.empleadoSeleccionado);
  const id = empleadoSeleccionado?.id ?? session?.user?.idUsuario;
  return {
    id,
    nombre: empleadoSeleccionado?.nombre ?? session?.user?.nombrecompleto ?? "",
    esOtro: !!empleadoSeleccionado,
  };
};
