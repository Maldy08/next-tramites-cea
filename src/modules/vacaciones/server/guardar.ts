import { NextRequest, NextResponse } from "next/server";
import type { GuardarSolicitudRequest, SolicitudCreada } from "@/modules/vacaciones/dtos";
import { ceaJson, errorResponse, fail, forbidden, ok, usuarioDeModulo } from "@/shared/server/cea";
import { puedeOperarEmpleado } from "@/shared/server/empleados";
import type { Result } from "@/shared/domain/result";
import { MODULO } from "./acceso";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const validar = (b: GuardarSolicitudRequest): string | null => {
  if (!b || !Number.isInteger(b.noEmp)) return "Datos incompletos";
  if (!FECHA.test(b.desde ?? "") || !FECHA.test(b.hasta ?? "")) return "Fechas inválidas";
  if (b.hasta < b.desde) return "La fecha de fin no puede ser anterior a la de inicio";
  if (b.fechaRegreso !== null && (!FECHA.test(b.fechaRegreso) || b.fechaRegreso <= b.hasta))
    return "La fecha de regreso debe ser posterior a la fecha de fin";
  if (b.idEmpleadoCubre !== null && (!Number.isInteger(b.idEmpleadoCubre) || b.idEmpleadoCubre === b.noEmp))
    return "Relevo no válido";
  if ((b.comentarios?.length ?? 0) > 1000) return "Los comentarios no pueden pasar de 1000 caracteres";
  return null;
};

// POST /api/vacaciones/solicitud: genera la solicitud (paso 1 de "Procesos", estatus 1) con folio VAC-NNNN-AAAA.
// Quien captura sale de la sesión, no del navegador.
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await usuarioDeModulo(MODULO);
    if (error) return error;

    const body = (await req.json()) as GuardarSolicitudRequest;
    const invalido = validar(body);
    if (invalido) return NextResponse.json(fail(invalido), { status: 400 });
    if (!(await puedeOperarEmpleado(user, body.noEmp))) return forbidden();

    // ceaJson (no ceaData) para regresar tal cual los mensajes de validación del backend.
    const res = await ceaJson<Result<SolicitudCreada>>(user, "NomVacaciones/Solicitud", {
      method: "POST",
      body: JSON.stringify({
        noEmp: body.noEmp,
        noEmpCaptura: user.idUsuario,
        desde: `${body.desde}T00:00:00`,
        hasta: `${body.hasta}T00:00:00`,
        fechaRegreso: body.fechaRegreso ? `${body.fechaRegreso}T00:00:00` : null,
        idEmpleadoCubre: body.idEmpleadoCubre,
        comentarios: body.comentarios?.trim() || null,
      }),
    });
    if (!res?.succeeded)
      return NextResponse.json(fail(res?.messages?.join(" ") || "No se pudo guardar la solicitud"), { status: 422 });
    return NextResponse.json(
      ok<SolicitudCreada>({ ...res.data, fechaRegreso: res.data.fechaRegreso.slice(0, 10) }, res.messages?.[0])
    );
  } catch (error) {
    return errorResponse(error);
  }
}
