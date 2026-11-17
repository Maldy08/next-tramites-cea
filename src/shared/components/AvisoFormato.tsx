import Link from "next/link";
import { IoAlertCircleOutline, IoArrowBackOutline, IoLockClosedOutline } from "react-icons/io5";

export type MotivoAviso = "noDisponible" | "error";

const TEXTOS: Record<MotivoAviso, { titulo: string; mensaje: string }> = {
  // Un solo mensaje para "no existe" y "sin permiso": no revela qué folios existen.
  noDisponible: {
    titulo: "Formato no disponible",
    mensaje:
      "El trámite que busca no existe o no tiene permiso para consultarlo. Solo puede ver los formatos de sus propios trámites o del personal a su cargo.",
  },
  error: {
    titulo: "No se pudo cargar el formato",
    mensaje: "Ocurrió un problema al consultar el trámite. Intente de nuevo en unos momentos.",
  },
};

/** Aviso en lugar del formato impreso cuando no se puede mostrar. */
export const AvisoFormato = ({ motivo }: { motivo: MotivoAviso }) => {
  const { titulo, mensaje } = TEXTOS[motivo];
  const Icono = motivo === "noDisponible" ? IoLockClosedOutline : IoAlertCircleOutline;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="h-1.5 bg-gradient-to-r from-[#691c32] to-[#bc955c]" />
        <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#691c32]/10">
            <Icono className="h-7 w-7 text-[#691c32]" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">{titulo}</h1>
          <p className="text-sm leading-relaxed text-slate-600">{mensaje}</p>
          <Link
            href="/expedientes"
            className="mt-2 inline-flex items-center gap-1.5 rounded bg-[#691c32] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#4f1526]"
          >
            <IoArrowBackOutline className="h-4 w-4" /> Volver a la Bandeja
          </Link>
        </div>
      </div>
    </main>
  );
};
