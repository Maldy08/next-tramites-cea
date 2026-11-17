import { NextResponse } from "next/server";
import type { Empleado } from "@/modules/viaticos/dtos";
import { ceaData, errorResponse, forbidden, ok } from "@/shared/server/cea";
import { esAdminViaticos, usuarioViaticos } from "./acceso";

// Empleados del departamento del usuario (para "Cambiar de empleado", solo nivel 9).
export async function GET() {
  const { user, error } = await usuarioViaticos();
  if (error) return error;
  if (!esAdminViaticos(user)) return forbidden();

  try {
    const empleados = await ceaData<Empleado[]>(user, `Empleados/GetEmpleadosByDeptoComi/${user.idDepartamento}`);
    return NextResponse.json(ok(empleados ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
