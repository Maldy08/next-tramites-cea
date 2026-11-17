import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, forbidden, ok, toInt } from "@/shared/server/cea";
import { getViatico, puedeOperarEmpleado, usuarioViaticos } from "./acceso";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ ejercicio: string; oficina: string; noviat: string }> }
) {
  const { user, error } = await usuarioViaticos();
  if (error) return error;

  const p = await params;
  try {
    const viatico = await getViatico(user, toInt(p.ejercicio), toInt(p.oficina), toInt(p.noviat));
    if (!viatico) return NextResponse.json(fail("Viático no encontrado"), { status: 404 });
    if (!(await puedeOperarEmpleado(user, viatico.noEmp))) return forbidden();
    return NextResponse.json(ok(viatico));
  } catch (error) {
    return errorResponse(error);
  }
}
