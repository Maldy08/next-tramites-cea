import { NextRequest, NextResponse } from "next/server";
import {
  INCIDENCIAS_JUSTIFICANTE,
  type AccionSolicitud,
  type GuardarJustificanteRequest,
  type JustificanteCreado,
} from "@/modules/justificantes/dtos";
import { ceaData, ceaJson, errorResponse, fail, forbidden, ok, toInt, usuarioDeModulo } from "@/shared/server/cea";
import type { Result } from "@/shared/domain/result";
import { puedeOperarEmpleado } from "@/shared/server/empleados";
import { TIPO_TRAMITE, type Tramite } from "@/shared/tramites";
import { MODULO } from "./acceso";

const FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Las reglas por incidencia (un día, hora fin > inicio...) las aplica el backend; aquí solo la forma.
const validar = (b: GuardarJustificanteRequest): string | null => {
  if (!b || !Number.isInteger(b.noEmp)) return "Datos incompletos";
  if (!INCIDENCIAS_JUSTIFICANTE.some((i) => i.id === b.tipoIncidencia)) return "Tipo de incidencia no válido";
  if (!FECHA_HORA.test(b.fechaInicio ?? "") || !FECHA_HORA.test(b.fechaFin ?? "")) return "Fecha u hora inválida";
  if (b.fechaFin < b.fechaInicio) return "La fecha final no puede ser anterior a la inicial";
  const motivo = b.justificacionMotivo?.trim() ?? "";
  if (!motivo) return "Escriba la explicación";
  if (motivo.length > 500) return "La explicación no puede pasar de 500 caracteres";
  return null;
};

// POST /api/justificantes/solicitud: genera el justificante (estatus 1) con folio JUS-NNNN-AAAA.
// Quien captura sale de la sesión.
export async function guardar(req: NextRequest) {
  try {
    const { user, error } = await usuarioDeModulo(MODULO);
    if (error) return error;

    const body = (await req.json()) as GuardarJustificanteRequest;
    const invalido = validar(body);
    if (invalido) return NextResponse.json(fail(invalido), { status: 400 });
    if (!(await puedeOperarEmpleado(user, body.noEmp))) return forbidden();

    // ceaJson (no ceaData) para regresar tal cual los mensajes de validación del backend.
    const res = await ceaJson<Result<JustificanteCreado>>(user, "NomPermisosJustificantes/Solicitud", {
      method: "POST",
      body: JSON.stringify({
        noEmp: body.noEmp,
        noEmpCaptura: user.idUsuario,
        tipoIncidencia: body.tipoIncidencia,
        fechaInicio: `${body.fechaInicio}:00`,
        fechaFin: `${body.fechaFin}:00`,
        justificacionMotivo: body.justificacionMotivo.trim(),
        idEmpleadoCubre: null,
      }),
    });
    if (!res?.succeeded)
      return NextResponse.json(fail(res?.messages?.join(" ") || "No se pudo guardar el justificante"), { status: 422 });
    return NextResponse.json(ok<JustificanteCreado>(res.data, res.messages?.[0]));
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/justificantes/solicitud/[idTramite] { accion: "enviar" | "cancelar", comentarios? }: cambio de estatus
// (NomTramites/{id}/Enviar o /Cancelar). Solo justificantes que el usuario puede operar.
export async function accion(req: NextRequest, { params }: { params: Promise<{ idTramite: string }> }) {
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

    const tramite = await ceaData<Tramite>(user, `NomTramites/${idTramite}`);
    if (tramite.tipoTramite !== TIPO_TRAMITE.justificantes || !(await puedeOperarEmpleado(user, tramite.idEmpleado)))
      return forbidden();

    const res = await ceaJson<Result<number>>(
      user,
      `NomTramites/${idTramite}/${body.accion === "enviar" ? "Enviar" : "Cancelar"}`,
      { method: "POST", body: JSON.stringify({ noEmpActor: user.idUsuario, comentarios: motivo || null }) }
    );
    if (!res?.succeeded)
      return NextResponse.json(fail(res?.messages?.join(" ") || "No se pudo aplicar la acción"), { status: 422 });
    return NextResponse.json(ok(res.data, res.messages?.[0]));
  } catch (error) {
    return errorResponse(error);
  }
}
