import { NextRequest, NextResponse } from "next/server";
import { type AlcanceCompaneros, type Companero, esSupervisor } from "@/shared/empleados";
import { ceaData, errorResponse, forbidden, getUser, ok, type SessionUser, unauthorized } from "./cea";

/** Lo que se usa de EmpleadoDto (api/Empleados). */
interface EmpleadoCea {
  empleado: number;
  nombreCompleto: string;
  descripcionPuesto: string;
  descripcionDepto: string;
  deptoComi: number;
  supervisorId: number | null;
}

/**
 * El supervisor (TRAMITES_NIVEL 2 o 3) opera a sus compañeros a cargo (EMPLEADOS.SUPERVISOR_ID = él) y, como
 * suplencia, a cualquier empleado con supervisor asignado de su mismo DEPTOCOMI. `empleado` = ficha del beneficiario.
 */
export const supervisaA = async (
  user: SessionUser,
  empleado: Pick<EmpleadoCea, "deptoComi" | "supervisorId">
): Promise<boolean> => {
  if (!esSupervisor(user.tramitesNivel) || empleado.supervisorId === null) return false;
  if (empleado.supervisorId === user.idUsuario) return true;
  // Suplencia: mismo DEPTOCOMI que la ficha de empleado del supervisor (no USUARIOS.DEPTO, que a veces difiere).
  const propio = await ceaData<EmpleadoCea | null>(user, `Empleados/GetEmpleadoById/${user.idUsuario}`);
  return !!propio && empleado.deptoComi === propio.deptoComi;
};

/** Trámites de un módulo sin nivel propio: el usuario los hace para sí mismo o, si es supervisor, ver `supervisaA`. */
export const puedeOperarEmpleado = async (user: SessionUser, noEmp: number): Promise<boolean> => {
  if (noEmp === user.idUsuario) return true;
  if (!esSupervisor(user.tramitesNivel)) return false;
  const empleado = await ceaData<EmpleadoCea | null>(user, `Empleados/GetEmpleadoById/${noEmp}`);
  return !!empleado && supervisaA(user, empleado);
};

// GET /api/companeros?alcance=mios|departamento (ver shared/empleados.ts). Solo TRAMITES_NIVEL 2 o 3.
// El backend no filtra por supervisor: se trae la lista de empleados activos y se filtra aquí.
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();
  if (!esSupervisor(user.tramitesNivel)) return forbidden("No tienes personal a tu cargo");
  const alcance: AlcanceCompaneros = req.nextUrl.searchParams.get("alcance") === "departamento" ? "departamento" : "mios";

  try {
    const empleados = (await ceaData<EmpleadoCea[]>(user, "Empleados")) ?? [];
    const nombre = new Map(empleados.map((e) => [e.empleado, e.nombreCompleto]));
    const deptoComi = empleados.find((e) => e.empleado === user.idUsuario)?.deptoComi;

    const companeros: Companero[] = empleados
      .filter(
        (e) =>
          e.supervisorId !== null &&
          e.empleado !== user.idUsuario &&
          (alcance === "mios" ? e.supervisorId === user.idUsuario : deptoComi !== undefined && e.deptoComi === deptoComi)
      )
      .map((e) => ({
        empleado: e.empleado,
        nombreCompleto: e.nombreCompleto,
        descripcionPuesto: e.descripcionPuesto,
        descripcionDepto: e.descripcionDepto,
        supervisor: { empleado: e.supervisorId!, nombre: nombre.get(e.supervisorId!) ?? `Empleado ${e.supervisorId}` },
      }))
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
    return NextResponse.json(ok(companeros));
  } catch (error) {
    return errorResponse(error);
  }
}
