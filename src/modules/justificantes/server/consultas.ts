import { NextRequest, NextResponse } from "next/server";
import type { EmpleadoJustificante } from "@/modules/justificantes/dtos";
import { ceaData, errorResponse, fail, ok, toInt } from "@/shared/server/cea";
import { TIPO_TRAMITE, type Tramite } from "@/shared/tramites";
import { usuarioParaEmpleado } from "./acceso";

type Params = { params: Promise<{ id: string }> };

// GET /api/justificantes/empleado/[id]: ficha del beneficiario.
export async function getEmpleado(_: NextRequest, { params }: Params) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;
    const e = await ceaData<EmpleadoJustificante>(user, `Empleados/GetEmpleadoById/${noEmp}`);
    return NextResponse.json(
      ok<EmpleadoJustificante>({
        empleado: e.empleado,
        nombreCompleto: e.nombreCompleto,
        descripcionPuesto: e.descripcionPuesto,
        descripcionDepto: e.descripcionDepto,
      })
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/justificantes/solicitudes/[id]?ano=AAAA: justificantes del empleado en el año (NomTramites tipo 4).
export async function getSolicitudes(req: NextRequest, { params }: Params) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;
    const ano = toInt(req.nextUrl.searchParams.get("ano") ?? "");
    if (Number.isNaN(ano)) return NextResponse.json(fail("Año no válido"), { status: 400 });
    const tramites = await ceaData<Tramite[]>(user, `NomTramites/Empleado/${noEmp}/${ano}?tipo=${TIPO_TRAMITE.justificantes}`);
    return NextResponse.json(ok(tramites ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
