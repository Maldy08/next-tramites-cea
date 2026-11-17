// Autorización de vacaciones: el usuario para sí mismo o, si es supervisor, para su gente (shared/server/empleados.ts).
import { NextResponse } from "next/server";
import { forbidden, toInt, usuarioDeModulo, type SessionUser } from "@/shared/server/cea";
import { puedeOperarEmpleado } from "@/shared/server/empleados";

export const MODULO = "vacaciones";

/** Usuario con acceso al módulo y permiso sobre el empleado `[id]` de la ruta. */
export const usuarioParaEmpleado = async (
  id: string
): Promise<{ user: SessionUser; noEmp: number; error?: never } | { user?: never; noEmp?: never; error: NextResponse }> => {
  const { user, error } = await usuarioDeModulo(MODULO);
  if (error) return { error };
  const noEmp = toInt(id);
  if (Number.isNaN(noEmp) || !(await puedeOperarEmpleado(user, noEmp))) return { error: forbidden() };
  return { user, noEmp };
};
