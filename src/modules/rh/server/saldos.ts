// Saldos de vacaciones de RH: proxy hacia api/NomTramitesRh/SaldosVacaciones. Solo TRAMITES_NIVEL 9; el backend lo
// vuelve a revisar con el usuario del token.
import { NextRequest, NextResponse } from "next/server";
import type { RegistroVacacionesRh, SaldoInicialRh, SaldoVacacionesRh } from "@/modules/rh/dtos";
import type { Result } from "@/shared/domain/result";
import { esAdministradorRh } from "@/shared/empleados";
import { ceaData, ceaJson, errorResponse, fail, forbidden, getUser, ok, toInt, unauthorized } from "@/shared/server/cea";

const PERVAC = /^\d{4}-[12]$/;

const usuarioRh = async () => {
  const user = await getUser();
  if (!user) return { error: unauthorized() };
  if (!esAdministradorRh(user.tramitesNivel)) return { error: forbidden("Solo el administrador de Recursos Humanos") };
  return { user };
};

const reenviar = <T>(res: Result<T> | null, porDefecto: string) =>
  res?.succeeded
    ? NextResponse.json(ok<T>(res.data, res.messages?.[0]))
    : NextResponse.json(fail(res?.messages?.join(" ") || porDefecto), { status: 422 });

// GET /api/rh/saldos: empleados activos con saldo y último registro.
export async function getSaldos() {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    return NextResponse.json(ok((await ceaData<SaldoVacacionesRh[]>(user, "NomTramitesRh/SaldosVacaciones")) ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}

type ParamsEmpleado = { params: Promise<{ noEmp: string }> };

// GET /api/rh/saldos/[noEmp]: historial M/D del empleado.
export async function getRegistros(_: NextRequest, { params }: ParamsEmpleado) {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    const noEmp = toInt((await params).noEmp);
    if (Number.isNaN(noEmp)) return NextResponse.json(fail("Empleado no válido"), { status: 400 });
    return NextResponse.json(ok((await ceaData<RegistroVacacionesRh[]>(user, `NomTramitesRh/SaldosVacaciones/${noEmp}`)) ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/rh/saldos/[noEmp] { perVac, diasXDisf }: saldo inicial / ajuste (origen R).
export async function guardarSaldo(req: NextRequest, { params }: ParamsEmpleado) {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    const noEmp = toInt((await params).noEmp);
    if (Number.isNaN(noEmp)) return NextResponse.json(fail("Empleado no válido"), { status: 400 });
    const body = (await req.json()) as SaldoInicialRh;
    if (!PERVAC.test(body?.perVac ?? "")) return NextResponse.json(fail("El periodo debe ser AAAA-1 o AAAA-2"), { status: 400 });
    if (!Number.isInteger(body.diasXDisf) || body.diasXDisf < 0)
      return NextResponse.json(fail("Los días por disfrutar deben ser un número entero"), { status: 400 });

    const res = await ceaJson<Result<unknown>>(user, `NomTramitesRh/SaldosVacaciones/${noEmp}`, {
      method: "POST",
      body: JSON.stringify({ perVac: body.perVac, diasXDisf: body.diasXDisf }),
    });
    return reenviar(res, "No se pudo registrar el saldo");
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/rh/saldos/registro/[idVacaemp]: solo registros capturados por RH.
export async function borrarRegistro(_: NextRequest, { params }: { params: Promise<{ idVacaemp: string }> }) {
  try {
    const { user, error } = await usuarioRh();
    if (error) return error;
    const id = toInt((await params).idVacaemp);
    if (Number.isNaN(id)) return NextResponse.json(fail("Registro no válido"), { status: 400 });
    const res = await ceaJson<Result<number>>(user, `NomTramitesRh/SaldosVacaciones/Registro/${id}`, { method: "DELETE" });
    return reenviar(res, "No se pudo eliminar el registro");
  } catch (error) {
    return errorResponse(error);
  }
}
