// Autorización propia de viáticos (los controladores de CEA no tienen [Authorize]).
import { esSupervisor } from "@/shared/empleados";
import type { Result } from "@/shared/domain/result";
import { ceaData, ceaJson, type SessionUser, usuarioDeModulo } from "@/shared/server/cea";
import { supervisaA } from "@/shared/server/empleados";
import type { Empleado, Viatico } from "@/modules/viaticos/dtos";
import { esNivelAdmin } from "@/modules/viaticos/lib/reglas";

export const MODULO = "viaticos";

export const usuarioViaticos = () => usuarioDeModulo(MODULO);

export const esAdminViaticos = (user: SessionUser) => esNivelAdmin(user.permisos?.[MODULO]);

/**
 * Un usuario trabaja sus propios viáticos y, además:
 * - el nivel 9 de viáticos, los de los empleados de su departamento (mismo criterio que GetEmpleadosByDeptoComi);
 * - el supervisor (TRAMITES_NIVEL >= 2), los de sus compañeros a cargo (EMPLEADOS.SUPERVISOR_ID = él) y, como
 *   suplencia, los de cualquier empleado con supervisor asignado de su mismo DEPTOCOMI (shared/server/empleados.ts).
 */
export const puedeOperarEmpleado = async (user: SessionUser, noEmp: number): Promise<boolean> => {
  if (noEmp === user.idUsuario) return true;
  const admin = esAdminViaticos(user);
  const supervisor = esSupervisor(user.tramitesNivel);
  if (!admin && !supervisor) return false;
  const empleado = await ceaData<Empleado | null>(user, `Empleados/GetEmpleadoById/${noEmp}`);
  if (!empleado) return false;
  if (admin && empleado.deptoComi === user.idDepartamento) return true;
  return supervisaA(user, empleado);
};

export const getViatico = (user: SessionUser, ejercicio: number, oficina: number, noviat: number) =>
  ceaJson<Result<Viatico | null>>(user, `Viatico/GetAllByEjercicioOficinaNoviat/${ejercicio}/${oficina}/${noviat}`).then(
    (r) => (r?.succeeded ? r.data : null)
  );
