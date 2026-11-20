// Bandeja de Firmas: proxy hacia api/NomTramitesFirmas. Solo TRAMITES_NIVEL 3 (esFirmante de shared/empleados.ts);
// el backend vuelve a revisar el nivel y que el trámite espere la firma del usuario del token (VALIDA_1 en estatus 2,
// VALIDA_2 en estatus 3), así que esto solo evita viajes inútiles.
import { NextRequest, NextResponse } from "next/server";
import type { AccionFirma, TramitePorFirmar } from "@/modules/firmas/dtos";
import type { Result } from "@/shared/domain/result";
import { esFirmante } from "@/shared/empleados";
import { ceaData, ceaJson, errorResponse, fail, forbidden, getUser, ok, toInt, unauthorized } from "@/shared/server/cea";

const usuarioFirmante = async () => {
  const user = await getUser();
  if (!user) return { error: unauthorized() };
  if (!esFirmante(user.tramitesNivel)) return { error: forbidden("Solo los jefes y directores que firman trámites") };
  return { user };
};

// GET /api/firmas/tramites: pendientes de firma del usuario (cualquier año).
export async function getPorFirmar() {
  try {
    const { user, error } = await usuarioFirmante();
    if (error) return error;
    return NextResponse.json(ok((await ceaData<TramitePorFirmar[]>(user, "NomTramitesFirmas/PorFirmar")) ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/firmas/tramite/[idTramite] { accion: "firmar" | "regresar", comentarios }
export async function accionFirma(req: NextRequest, { params }: { params: Promise<{ idTramite: string }> }) {
  try {
    const { user, error } = await usuarioFirmante();
    if (error) return error;
    const id = toInt((await params).idTramite);
    if (Number.isNaN(id)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });
    const body = (await req.json()) as AccionFirma;
    if (body?.accion !== "firmar" && body?.accion !== "regresar")
      return NextResponse.json(fail("Acción no válida"), { status: 400 });
    const comentarios = body.comentarios?.trim() || null;
    if (body.accion === "regresar" && !comentarios)
      return NextResponse.json(fail("Escriba el motivo por el que regresa el trámite"), { status: 400 });

    const res = await ceaJson<Result<number>>(
      user,
      `NomTramitesFirmas/Tramite/${id}/${body.accion === "firmar" ? "Firmar" : "Regresar"}`,
      { method: "POST", body: JSON.stringify({ comentarios }) }
    );
    return res?.succeeded
      ? NextResponse.json(ok<number>(res.data, res.messages?.[0]))
      : NextResponse.json(fail(res?.messages?.join(" ") || "No se pudo aplicar la acción"), { status: 422 });
  } catch (error) {
    return errorResponse(error);
  }
}
