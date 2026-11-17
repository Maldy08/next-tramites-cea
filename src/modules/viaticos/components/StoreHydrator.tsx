"use client";

import { useEffect } from "react";
import { useViaticosStore } from "@/modules/viaticos/store/useViaticosStore";

/**
 * Carga el empleado seleccionado (nivel 9) de sessionStorage una vez montada la app.
 * Si el estado guardado es de otro usuario (p. ej. expiró la sesión y entró alguien más), se descarta.
 */
export const StoreHydrator = ({ userId }: { userId?: number }) => {
  useEffect(() => {
    const sincronizar = async () => {
      await useViaticosStore.persist.rehydrate();
      const { owner, reset, setOwner, setHidratado } = useViaticosStore.getState();
      if (owner !== (userId ?? null)) {
        reset();
        setOwner(userId ?? null);
      }
      setHidratado();
    };
    sincronizar();
  }, [userId]);
  return null;
};
