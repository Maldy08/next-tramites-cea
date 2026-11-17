import { NextRequest, NextResponse } from "next/server";
import type { EmpleadoVacaciones, SaldoEmpleado, SaldoVacaciones } from "@/modules/vacaciones/dtos";
import { ceaData, errorResponse, ok } from "@/shared/server/cea";
import { usuarioParaEmpleado } from "./acceso";

// GET /api/vacaciones/saldo/[id]: ficha del empleado + saldo oficial (NomVacaciones/SaldoVacaciones).
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;

    const [ficha, saldo] = await Promise.all([
      ceaData<EmpleadoVacaciones>(user, `Empleados/GetEmpleadoById/${noEmp}`),
      ceaData<SaldoVacaciones>(user, `NomVacaciones/SaldoVacaciones/${noEmp}`),
    ]);
    const empleado: EmpleadoVacaciones = {
      empleado: ficha.empleado,
      nombreCompleto: ficha.nombreCompleto,
      descripcionPuesto: ficha.descripcionPuesto,
      descripcionDepto: ficha.descripcionDepto,
      deptoComi: ficha.deptoComi,
    };
    return NextResponse.json(ok<SaldoEmpleado>({ empleado, saldo }));
  } catch (error) {
    return errorResponse(error);
  }
}
