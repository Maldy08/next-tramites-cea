// Detalle y modificación de un trámite de NOM_TRAMITES hacia CEA. Lo usan:
// - RH (modules/rh/server/tramites.ts → api/NomTramitesRh/Tramite/{id}..., cualquier estatus, motivo obligatorio);
// - el empleado o su supervisor (/api/tramites/[idTramite] → api/NomTramites/{id}/..., solo Creado o Regresado).
// El backend revisa quién es con el usuario del token; aquí solo se arma el cuerpo.
import { NextRequest, NextResponse } from "next/server";
import type { Result } from "@/shared/domain/result";
import type { DetalleTramite, ModificarTramiteCuerpo } from "@/shared/tramites";
import { ceaData, ceaJson, errorResponse, fail, getUser, ok, type SessionUser, toInt, unauthorized } from "./cea";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Rutas de CEA para un trámite: `${base}` = detalle, `${base}/Vacaciones` y `${base}/PermisoJustificante` = PUT. */
export const rutaRh = (id: number) => `NomTramitesRh/Tramite/${id}`;
export const rutaEmpleado = (id: number) => `NomTramites/${id}`;
const rutaDetalle = (base: string) => (base.startsWith("NomTramitesRh/") ? base : `${base}/Detalle`);

export const detalleTramite = (user: SessionUser, base: string) => ceaData<DetalleTramite>(user, rutaDetalle(base));

/** Valida el cuerpo y lo manda a CEA. El relevo se conserva (se toma del detalle actual). */
export const modificarTramiteCea = async (
  user: SessionUser,
  base: string,
  body: ModificarTramiteCuerpo,
  motivoObligatorio: boolean
): Promise<NextResponse> => {
  const comentarios = body?.comentarios?.trim() ?? "";
  if (motivoObligatorio && !comentarios) return NextResponse.json(fail("Escriba el motivo de la modificación"), { status: 400 });

  const actual = await detalleTramite(user, base);
  let res: Result<number>;
  if (body?.tipo === "vacaciones") {
    if (!actual.vacaciones) return NextResponse.json(fail("El trámite no es de vacaciones"), { status: 400 });
    if (!FECHA.test(body.desde ?? "") || !FECHA.test(body.hasta ?? "") || (body.fechaRegreso && !FECHA.test(body.fechaRegreso)))
      return NextResponse.json(fail("Fecha inválida"), { status: 400 });
    res = await ceaJson<Result<number>>(user, `${base}/Vacaciones`, {
      method: "PUT",
      body: JSON.stringify({
        desde: `${body.desde}T00:00:00`,
        hasta: `${body.hasta}T00:00:00`,
        fechaRegreso: body.fechaRegreso ? `${body.fechaRegreso}T00:00:00` : null,
        idEmpleadoCubre: actual.vacaciones.idEmpleadoCubre,
        comentarios: comentarios || null,
      }),
    });
  } else if (body?.tipo === "permisoJustificante") {
    if (!actual.permisoJustificante) return NextResponse.json(fail("El trámite no es permiso ni justificante"), { status: 400 });
    if (!FECHA_HORA.test(body.fechaInicio ?? "") || !FECHA_HORA.test(body.fechaFin ?? ""))
      return NextResponse.json(fail("Fecha u hora inválida"), { status: 400 });
    res = await ceaJson<Result<number>>(user, `${base}/PermisoJustificante`, {
      method: "PUT",
      body: JSON.stringify({
        tipoIncidencia: body.tipoIncidencia,
        fechaInicio: `${body.fechaInicio}:00`,
        fechaFin: `${body.fechaFin}:00`,
        justificacionMotivo: body.justificacionMotivo?.trim() ?? "",
        idEmpleadoCubre: actual.permisoJustificante.idEmpleadoCubre,
        comentarios: comentarios || null,
      }),
    });
  } else {
    return NextResponse.json(fail("Datos incompletos"), { status: 400 });
  }
  return res?.succeeded
    ? NextResponse.json(ok(res.data, res.messages?.[0]))
    : NextResponse.json(fail(res?.messages?.join(" ") || "No se pudo modificar el trámite"), { status: 422 });
};

type ParamsTramite = { params: Promise<{ idTramite: string }> };

// /api/tramites/[idTramite]: el empleado (o su supervisor) ve y edita su trámite (backend: solo Creado o Regresado).
export async function GET(_: NextRequest, { params }: ParamsTramite) {
  const user = await getUser();
  if (!user) return unauthorized();
  const id = toInt((await params).idTramite);
  if (Number.isNaN(id)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });
  try {
    return NextResponse.json(ok(await detalleTramite(user, rutaEmpleado(id))));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, { params }: ParamsTramite) {
  const user = await getUser();
  if (!user) return unauthorized();
  const id = toInt((await params).idTramite);
  if (Number.isNaN(id)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });
  try {
    return await modificarTramiteCea(user, rutaEmpleado(id), (await req.json()) as ModificarTramiteCuerpo, false);
  } catch (error) {
    return errorResponse(error);
  }
}
