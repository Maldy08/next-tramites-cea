import type { ColorModulo } from "@/shared/modulos";

interface ClasesColor {
  icono: string;
  borde: string;
  boton: string;
  contorno: string;
  /** Tarjeta del Catálogo Oficial (Tablero): borde al pasar el mouse, ícono y texto del color. */
  catalogo: { borde: string; icono: string; texto: string; textoHover: string };
}

// Clases completas (no interpoladas) para que Tailwind las detecte al compilar.
export const COLORES_MODULO: Record<ColorModulo, ClasesColor> = {
  vino: {
    icono: "bg-primary-50 text-primary-800",
    borde: "hover:border-primary-300",
    boton: "bg-primary-900 hover:bg-primary-800 text-white",
    contorno: "border-primary-200 text-primary-800 hover:bg-primary-50",
    catalogo: {
      borde: "hover:border-primary-900",
      icono: "bg-primary-100 text-primary-900",
      texto: "text-primary-900",
      textoHover: "group-hover:text-primary-900",
    },
  },
  esmeralda: {
    icono: "bg-emerald-50 text-emerald-700",
    borde: "hover:border-emerald-300",
    boton: "bg-emerald-700 hover:bg-emerald-800 text-white",
    contorno: "border-emerald-200 text-emerald-800 hover:bg-emerald-50",
    catalogo: {
      borde: "hover:border-emerald-600",
      icono: "bg-emerald-100 text-emerald-700",
      texto: "text-emerald-700",
      textoHover: "group-hover:text-emerald-700",
    },
  },
  azul: {
    icono: "bg-blue-50 text-blue-700",
    borde: "hover:border-blue-300",
    boton: "bg-blue-700 hover:bg-blue-800 text-white",
    contorno: "border-blue-200 text-blue-800 hover:bg-blue-50",
    catalogo: {
      borde: "hover:border-blue-600",
      icono: "bg-blue-100 text-blue-700",
      texto: "text-blue-700",
      textoHover: "group-hover:text-blue-700",
    },
  },
  ambar: {
    icono: "bg-amber-50 text-amber-700",
    borde: "hover:border-amber-300",
    boton: "bg-amber-600 hover:bg-amber-700 text-white",
    contorno: "border-amber-200 text-amber-800 hover:bg-amber-50",
    catalogo: {
      borde: "hover:border-amber-500",
      icono: "bg-amber-100 text-amber-700",
      texto: "text-amber-700",
      textoHover: "group-hover:text-amber-700",
    },
  },
  cielo: {
    icono: "bg-sky-50 text-sky-700",
    borde: "hover:border-sky-300",
    boton: "bg-sky-700 hover:bg-sky-800 text-white",
    contorno: "border-sky-200 text-sky-800 hover:bg-sky-50",
    catalogo: {
      borde: "hover:border-sky-600",
      icono: "bg-sky-100 text-sky-700",
      texto: "text-sky-700",
      textoHover: "group-hover:text-sky-700",
    },
  },
};
