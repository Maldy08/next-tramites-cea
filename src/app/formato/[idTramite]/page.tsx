import { redirect } from "next/navigation";
import { AvisoFormato } from "@/shared/components/AvisoFormato";
import { FormatoTramiteHoja } from "@/shared/components/FormatoTramite";
import type { FormatoTramite } from "@/shared/formato";
import { CeaError, getUser, toInt } from "@/shared/server/cea";
import { cargarFormatoTramite } from "@/shared/server/formato";

// Formato oficial impreso de cualquier trámite de RH (NOM_TRAMITES), por id de trámite. Fuera de (sistema) a
// propósito: sin sidebar ni header, solo la hoja carta y la barra de imprimir.
// Si el trámite no existe o el usuario no puede verlo se muestra el MISMO aviso (no revela qué folios existen).
export default async function FormatoTramitePage({ params }: { params: Promise<{ idTramite: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const idTramite = toInt((await params).idTramite);
  if (Number.isNaN(idTramite) || idTramite <= 0) return <AvisoFormato motivo="noDisponible" />;

  let formato: FormatoTramite | null;
  try {
    formato = await cargarFormatoTramite(user, idTramite);
  } catch (e) {
    // 404/422 = el backend no encontró el trámite; lo demás es falla de comunicación.
    const noExiste = e instanceof CeaError && (e.status === 404 || e.status === 422);
    if (!noExiste) console.error(`[formato] trámite ${idTramite}:`, e);
    return <AvisoFormato motivo={noExiste ? "noDisponible" : "error"} />;
  }
  if (!formato) return <AvisoFormato motivo="noDisponible" />;
  return <FormatoTramiteHoja formato={formato} />;
}

export const metadata = { title: "Formato de trámite · Trámites CEA" };
