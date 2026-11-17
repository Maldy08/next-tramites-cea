import { NextRequest, NextResponse } from "next/server";
import type { EmpleadoVacaciones, FirmasTramite } from "@/modules/vacaciones/dtos";
import { ceaData, errorResponse, ok } from "@/shared/server/cea";
import { usuarioParaEmpleado } from "./acceso";

// GET /api/vacaciones/firmas/[id]: quién firma el trámite del empleado (NomTramites/Firmas/{noemp}/{depto}).
// El depto se toma de la ficha del empleado (DEPTOCOMI), no del cliente.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;

    const ficha = await ceaData<EmpleadoVacaciones>(user, `Empleados/GetEmpleadoById/${noEmp}`);
    const firmas = await ceaData<FirmasTramite>(user, `NomTramites/Firmas/${noEmp}/${ficha.deptoComi}`);
    return NextResponse.json(ok<FirmasTramite>(firmas));
  } catch (error) {
    return errorResponse(error);
  }
}
