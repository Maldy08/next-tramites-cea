import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ejercicioActual = () => new Date().getFullYear();

/** Ejercicios seleccionables: el actual y el anterior (misma regla que el sistema de viáticos). */
export const ejerciciosDisponibles = () => [ejercicioActual(), ejercicioActual() - 1];

interface EjercicioStore {
  /** Ejercicio fiscal con el que se trabaja en todo el sistema (folios, listados, capturas). */
  ejercicio: number;
  setEjercicio: (ejercicio: number) => void;
  /** Usuario dueño del valor guardado; si otro inicia sesión en la pestaña se descarta. */
  owner: number | null;
  /** true cuando ya se leyó sessionStorage; las pantallas esperan esto antes de pedir datos. */
  hidratado: boolean;
}

// skipHydration: se rehidrata en <EstadoSesion/> al montar, para que el HTML del servidor
// (año actual) coincida con el primer render del cliente.
export const useEjercicioStore = create<EjercicioStore>()(
  persist(
    (set) => ({
      ejercicio: ejercicioActual(),
      setEjercicio: (ejercicio) => set({ ejercicio }),
      owner: null,
      hidratado: false,
    }),
    {
      name: "tramites-cea:ejercicio",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: ({ ejercicio, owner }) => ({ ejercicio, owner }),
    }
  )
);

/** Lee sessionStorage y descarta el valor si es de otro usuario o ya no es un ejercicio válido. */
export const hidratarEjercicio = async (userId: number | null) => {
  await useEjercicioStore.persist.rehydrate();
  const { owner, ejercicio } = useEjercicioStore.getState();
  if (owner !== userId || !ejerciciosDisponibles().includes(ejercicio)) {
    useEjercicioStore.setState({ ejercicio: ejercicioActual(), owner: userId });
  }
  useEjercicioStore.setState({ hidratado: true });
};
