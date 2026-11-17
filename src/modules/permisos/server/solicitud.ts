import { NextRequest, NextResponse } from "next/server";
import { INCIDENCIAS_PERMISO, type AccionSolicitud, type GuardarPermisoRequest, type PermisoCreado } from "@/modules/permisos/dtos";
import { ceaData, ceaJson, errorResponse, fail, forbidden, ok, toInt, usuarioDeModulo } from "@/shared/server/cea";
import type { Result } from "@/shared/domain/result";
import { puedeOperarEmpleado } from "@/shared/server/empleados";
import { TIPO_TRAMITE, type Tramite } from "@/shared/tramites";
import { MODULO } from "./acceso";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const validar = (b: GuardarPermisoRequest): string | null => {
  if (!b || !Number.isInteger(b.noEmp)) return "Datos incompletos";
  if (!INCIDENCIAS_PERMISO.some((i) => i.id === b.tipoIncidencia)) return "Tipo de permiso no válido";
  if (!FECHA.test(b.fechaInicio ?? "") || !FECHA.test(b.fechaFin ?? "")) return "Fechas inválidas";
  if (b.fechaFin < b.fechaInicio) return "La fecha de fin no puede ser anterior a la de inicio";
  const motivo = b.justificacionMotivo?.trim() ?? "";
  if (!motivo) return "Escriba la justificación";
  if (motivo.length > 500) return "La justificación no puede pasar de 500 caracteres";
  if (b.idEmpleadoCubre !== null && (!Number.isInteger(b.idEmpleadoCubre) || b.idEmpleadoCubre === b.noEmp))
    return "Relevo no válido";
  return null;
};

// POST /api/permisos/solicitud: genera el permiso (estatus 1) con folio PER-NNNN-AAAA. Quien captura sale de la sesión.
export async function guardar(req: NextRequest) {
  try {
    const { user, error } = await usuarioDeModulo(MODULO);
    if (error) return error;

    const body = (await req.json()) as GuardarPermisoRequest;
    const invalido = validar(body);
    if (invalido) return NextResponse.json(fail(invalido), { status: 400 });
    if (!(await puedeOperarEmpleado(user, body.noEmp))) return forbidden();

    // ceaJson (no ceaData) para regresar tal cual los mensajes de validación del backend.
    const res = await ceaJson<Result<PermisoCreado>>(user, "NomPermisosJustificantes/Solicitud", {
      method: "POST",
      body: JSON.stringify({
        noEmp: body.noEmp,
        noEmpCaptura: user.idUsuario,
        tipoIncidencia: body.tipoIncidencia,
        fechaInicio: `${body.fechaInicio}T00:00:00`,
        fechaFin: `${body.fechaFin}T00:00:00`,
        justificacionMotivo: body.justificacionMotivo.trim(),
        idEmpleadoCubre: body.idEmpleadoCubre,
      }),
    });
    if (!res?.succeeded)
      return NextResponse.json(fail(res?.messages?.join(" ") || "No se pudo guardar el permiso"), { status: 422 });
    return NextResponse.json(ok<PermisoCreado>(res.data, res.messages?.[0]));
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/permisos/solicitud/[idTramite] { accion: "enviar" | "cancelar", comentarios? }: cambio de estatus
// (NomTramites/{id}/Enviar o /Cancelar). Solo trámites de permisos que el usuario puede operar.
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
    if (tramite.tipoTramite !== TIPO_TRAMITE.permisos || !(await puedeOperarEmpleado(user, tramite.idEmpleado)))
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
