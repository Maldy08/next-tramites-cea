import { NextRequest, NextResponse } from "next/server";
import type { Empleado } from "@/modules/viaticos/dtos";
import { ceaData, errorResponse, forbidden, ok, toInt } from "@/shared/server/cea";
import { puedeOperarEmpleado, usuarioViaticos } from "./acceso";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await usuarioViaticos();
  if (error) return error;

  const id = toInt((await params).id);
  try {
    if (!(await puedeOperarEmpleado(user, id))) return forbidden();
    const empleado = await ceaData<Empleado>(user, `Empleados/GetEmpleadoById/${id}`);
    return NextResponse.json(ok(empleado));
  } catch (error) {
    return errorResponse(error);
  }
}
