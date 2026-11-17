import { NextRequest, NextResponse } from "next/server";
import type { DetalleSolicitud, SolicitudVacaciones } from "@/modules/vacaciones/dtos";
import { ceaData, ceaJson, errorResponse, fail, forbidden, ok, toInt, usuarioDeModulo, type SessionUser } from "@/shared/server/cea";
import type { Result } from "@/shared/domain/result";
import { puedeOperarEmpleado } from "@/shared/server/empleados";
import { TIPO_TRAMITE, type Tramite } from "@/shared/tramites";
import type { AccionSolicitud } from "@/modules/vacaciones/dtos";
import { MODULO } from "./acceso";

const soloFecha = (valor: string | null) => (valor ? valor.slice(0, 10) : null);

// GET /api/vacaciones/solicitud/[idTramite]: trámite con su bitácora (NomTramites/{id}) + lo guardado de la
// solicitud (NomVacaciones/Solicitud). Solo si es de vacaciones y el usuario puede operar al beneficiario.
export async function GET(_: NextRequest, { params }: { params: Promise<{ idTramite: string }> }) {
  try {
    const { user, error } = await usuarioDeModulo(MODULO);
    if (error) return error;
    const idTramite = toInt((await params).idTramite);
    if (Number.isNaN(idTramite)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });

    const tramite = await ceaData<Tramite>(user, `NomTramites/${idTramite}`);
    if (tramite.tipoTramite !== TIPO_TRAMITE.vacaciones || !(await puedeOperarEmpleado(user, tramite.idEmpleado)))
      return forbidden();

    const solicitud = await ceaData<SolicitudVacaciones>(user, `NomVacaciones/Solicitud/${idTramite}`);
    return NextResponse.json(
      ok<DetalleSolicitud>({
        tramite,
        solicitud: {
          ...solicitud,
          fDesde: soloFecha(solicitud.fDesde)!,
          fHasta: soloFecha(solicitud.fHasta)!,
          fechaRegreso: soloFecha(solicitud.fechaRegreso),
          periodos: solicitud.periodos.map((p) => ({ ...p, fDesde: soloFecha(p.fDesde), fHasta: soloFecha(p.fHasta) })),
        },
      })
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/** Trámite de vacaciones que el usuario puede operar; nulo si es de otro tipo o no le corresponde. */
const tramiteOperable = async (user: SessionUser, idTramite: number): Promise<Tramite | null> => {
  const tramite = await ceaData<Tramite>(user, `NomTramites/${idTramite}`);
  return tramite.tipoTramite === TIPO_TRAMITE.vacaciones && (await puedeOperarEmpleado(user, tramite.idEmpleado))
    ? tramite
    : null;
};

// POST /api/vacaciones/solicitud/[idTramite] { accion: "enviar" | "cancelar", comentarios? }: cambio de estatus
// (NomTramites/{id}/Enviar o /Cancelar). Quién lo hace sale de la sesión; el backend valida el estatus actual.
export async function POST(req: NextRequest, { params }: { params: Promise<{ idTramite: string }> }) {
  try {
    const { user, error } = await usuarioDeModulo(MODULO);
    if (error) return error;
    const idTramite = toInt((await params).idTramite);
    if (Number.isNaN(idTramite)) return NextResponse.json(fail("Trámite no válido"), { status: 400 });

    const body = (await req.json()) as AccionSolicitud;
    if (body?.accion !== "enviar" && body?.accion !== "cancelar")
      return NextResponse.json(fail("Acción no válida"), { status: 400 });
    const motivo = body.comentarios?.trim() ?? "";
    if (body.accion === "cancelar" && !motivo)
      return NextResponse.json(fail("Escriba el motivo de la cancelación"), { status: 400 });

    if (!(await tramiteOperable(user, idTramite))) return forbidden();

    const res = await ceaJson<Result<number>>(
      user,
      `NomTramites/${idTramite}/${body.accion === "enviar" ? "Enviar" : "Cancelar"}`,
      {
        method: "POST",
        body: JSON.stringify({ noEmpActor: user.idUsuario, comentarios: motivo || null }),
      }
    );
    if (!res?.succeeded)
      return NextResponse.json(fail(res?.messages?.join(" ") || "No se pudo aplicar la acción"), { status: 422 });
    return NextResponse.json(ok(res.data, res.messages?.[0]));
  } catch (error) {
    return errorResponse(error);
  }
}
