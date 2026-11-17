import { NextRequest, NextResponse } from "next/server";
import { ceaData, errorResponse, fail, ok, toInt } from "@/shared/server/cea";
import { TIPO_TRAMITE, type Tramite } from "@/shared/tramites";
import { usuarioParaEmpleado } from "./acceso";

// GET /api/vacaciones/solicitudes/[id]?ano=AAAA: solicitudes de vacaciones del empleado en el año
// (NomTramites/Empleado con tipo 1), sin bitácora.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;

    const ano = toInt(req.nextUrl.searchParams.get("ano") ?? "");
    if (Number.isNaN(ano)) return NextResponse.json(fail("Año no válido"), { status: 400 });

    const tramites = await ceaData<Tramite[]>(user, `NomTramites/Empleado/${noEmp}/${ano}?tipo=${TIPO_TRAMITE.vacaciones}`);
    return NextResponse.json(ok(tramites ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
