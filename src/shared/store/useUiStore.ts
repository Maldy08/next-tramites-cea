import { create } from "zustand";

interface UiStore {
  /** Sidebar abierto en móvil/tablet (en escritorio siempre está visible). */
  sidebarAbierto: boolean;
  setSidebarAbierto: (abierto: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarAbierto: false,
  setSidebarAbierto: (sidebarAbierto) => set({ sidebarAbierto }),
}));
