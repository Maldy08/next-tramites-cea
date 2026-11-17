import { NextRequest, NextResponse } from "next/server";
import type { Relevo } from "@/modules/vacaciones/dtos";
import { ceaData, errorResponse, ok } from "@/shared/server/cea";
import { usuarioParaEmpleado } from "./acceso";

// GET /api/vacaciones/relevos/[id]: empleados activos que pueden cubrir a [id] (todos menos él).
// El filtro "Únicamente del departamento" lo hace la captura con `deptoComi`.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;

    const empleados = (await ceaData<Relevo[]>(user, "Empleados")) ?? [];
    const relevos: Relevo[] = empleados
      .filter((e) => e.empleado !== noEmp)
      .map((e) => ({
        empleado: e.empleado,
        nombreCompleto: e.nombreCompleto,
        descripcionPuesto: e.descripcionPuesto,
        descripcionDepto: e.descripcionDepto,
        deptoComi: e.deptoComi,
      }))
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
    return NextResponse.json(ok(relevos));
  } catch (error) {
    return errorResponse(error);
  }
}
