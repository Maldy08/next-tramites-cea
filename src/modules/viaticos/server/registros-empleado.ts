import { NextRequest, NextResponse } from "next/server";
import type { ViaticoListado } from "@/modules/viaticos/dtos";
import { ceaData, errorResponse, forbidden, ok, toInt } from "@/shared/server/cea";
import { puedeOperarEmpleado, usuarioViaticos } from "./acceso";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ ejercicio: string; empleado: string }> }
) {
  const { user, error } = await usuarioViaticos();
  if (error) return error;

  const p = await params;
  const ejercicio = toInt(p.ejercicio);
  const empleado = toInt(p.empleado);
  try {
    if (!(await puedeOperarEmpleado(user, empleado))) return forbidden();
    const lista = await ceaData<ViaticoListado[]>(user, `Viatico/ListaViaticosPorEmpleado/${ejercicio}/${empleado}`);
    return NextResponse.json(ok(lista ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
