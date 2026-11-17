import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface EmpleadoSeleccionado {
  id: number;
  nombre: string;
}

interface ViaticosStore {
  /** Usuario (noEmpleado) dueño del estado guardado; si otro inicia sesión en la pestaña se descarta. */
  owner: number | null;
  /** true cuando ya se leyó sessionStorage; las pantallas esperan esto antes de pedir datos. */
  hidratado: boolean;
  setHidratado: () => void;
  setOwner: (owner: number | null) => void;
  /** Solo nivel 9: empleado a cuyo nombre se captura/consulta. null = el propio usuario. */
  empleadoSeleccionado: EmpleadoSeleccionado | null;
  setEmpleadoSeleccionado: (empleado: EmpleadoSeleccionado | null) => void;
  modalEmpleadosAbierto: boolean;
  setModalEmpleadosAbierto: (abierto: boolean) => void;
  reset: () => void;
}

// skipHydration: se rehidrata en <StoreHydrator/> al montar, para que el HTML del servidor
// (sin empleado seleccionado) coincida con el primer render del cliente.
export const useViaticosStore = create<ViaticosStore>()(
  persist(
    (set) => ({
      owner: null,
      hidratado: false,
      setHidratado: () => set({ hidratado: true }),
      setOwner: (owner) => set({ owner }),
      empleadoSeleccionado: null,
      setEmpleadoSeleccionado: (empleadoSeleccionado) => set({ empleadoSeleccionado }),
      modalEmpleadosAbierto: false,
      setModalEmpleadosAbierto: (modalEmpleadosAbierto) => set({ modalEmpleadosAbierto }),
      reset: () => set({ empleadoSeleccionado: null, modalEmpleadosAbierto: false }),
    }),
    {
      name: "tramites-cea:viaticos",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: ({ owner, empleadoSeleccionado }) => ({ owner, empleadoSeleccionado }),
    }
  )
);
