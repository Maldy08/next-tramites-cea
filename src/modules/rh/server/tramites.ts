// Administración de Trámites de RH: proxy hacia api/NomTramitesRh. Solo TRAMITES_NIVEL 9 (shared/empleados.ts);
// el backend lo vuelve a revisar con el usuario del token, así que esto solo evita viajes inútiles.
import { NextRequest, NextResponse } from "next/server";
import type { AccionRh, DetalleTramiteRh, ModificarRh, TramiteRh } from "@/modules/rh/dtos";
import type { Result } from "@/shared/domain/result";
import { esAdministradorRh } from "@/shared/empleados";
import { ceaData, ceaJson, errorResponse, fail, forbidden, getUser, ok, toInt, unauthorized } from "@/shared/server/cea";
import { modificarTramiteCea, rutaRh } from "@/shared/server/tramites";

const usuarioRh = async () => {
  const user = await getUser();
  if (!user) return { error: unauthorized() };
  if (!esAdministradorRh(user.tramitesNivel)) return { error: forbidden("Solo el administrador de Recursos Humanos") };
  return { user };
};

/** Respuesta del backend tal cual (sus mensajes de validación llegan al usuario). */
const reenviar = <T>(res: Result<T> | null, porDefecto: string) =>
  res?.succeeded
    ? NextResponse.json(ok<T>(res.data, res.messages?.[0]))
    : NextResponse.json(fail(res?.messages?.join(" ") || porDefecto), { status: 422 });

// GET /api/rh/tramites/[ano]?tipo=&estatus=
export async function getTramites(req: NextRequest, { params }: { params: Promise<{ ano: string }> }) {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    const ano = toInt((await params).ano);
    if (Number.isNaN(ano)) return NextResponse.json(fail("Año no válido"), { status: 400 });
    const q = new URLSearchParams();
    for (const k of ["tipo", "estatus"]) {
      const v = toInt(req.nextUrl.searchParams.get(k) ?? "");
      if (!Number.isNaN(v)) q.set(k, String(v));
    }
    const lista = await ceaData<TramiteRh[]>(user, `NomTramitesRh/${ano}${q.size ? `?${q}` : ""}`);
    return NextResponse.json(ok(lista ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}

type ParamsTramite = { params: Promise<{ idTramite: string }> };

const idDe = async ({ params }: ParamsTramite) => toInt((await params).idTramite);

// GET /api/rh/tramite/[idTramite]: encabezado, bitácora y detalle para modificar.
export async function getTramite(_: NextRequest, ctx: ParamsTramite) {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    const id = await idDe(ctx);
    if (Number.isNaN(id)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });
    return NextResponse.json(ok(await ceaData<DetalleTramiteRh>(user, `NomTramitesRh/Tramite/${id}`)));
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/rh/tramite/[idTramite] { accion: "completar" | "cancelar", comentarios }
export async function accionTramite(req: NextRequest, ctx: ParamsTramite) {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    const id = await idDe(ctx);
    if (Number.isNaN(id)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });
    const body = (await req.json()) as AccionRh;
    if (body?.accion !== "completar" && body?.accion !== "cancelar")
      return NextResponse.json(fail("Acción no válida"), { status: 400 });
    const comentarios = body.comentarios?.trim() || null;
    if (body.accion === "cancelar" && !comentarios)
      return NextResponse.json(fail("Escriba el motivo de la cancelación"), { status: 400 });

    const res = await ceaJson<Result<number>>(
      user,
      `NomTramitesRh/Tramite/${id}/${body.accion === "completar" ? "Completar" : "Cancelar"}`,
      { method: "POST", body: JSON.stringify({ comentarios }) }
    );
    return reenviar(res, "No se pudo aplicar la acción");
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/rh/tramite/[idTramite]: modificar en cualquier estatus (motivo obligatorio; el relevo se conserva).
export async function modificarTramite(req: NextRequest, ctx: ParamsTramite) {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    const id = await idDe(ctx);
    if (Number.isNaN(id)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });
    return await modificarTramiteCea(user, rutaRh(id), (await req.json()) as ModificarRh, true);
  } catch (error) {
    return errorResponse(error);
  }
}
