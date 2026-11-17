// Formato impreso de un trámite de RH: datos de Oracle (api/NomTramites/{id}/Formato). Lo pueden ver:
//   1) quien firma el trámite: jefe (VALIDA_1), director (VALIDA_2) o responsable de RH (DEPTOS_UE 24 EMP_RESPON);
//      la vista VS_TRAMITES_FORMATO ya trae sus números, no hace falta otra consulta;
//   2) quien puede operar al empleado del trámite: él mismo o su supervisor (puedeOperarEmpleado);
//   3) el administrador de RH (TRAMITES_NIVEL 9; el backend también lo revisa).
import { esAdministradorRh } from "@/shared/empleados";
import type { FormatoTramite } from "@/shared/formato";
import { ceaData, type SessionUser } from "./cea";
import { puedeOperarEmpleado } from "./empleados";

/** El usuario es uno de los firmantes del trámite. */
export const firmaElTramite = (user: SessionUser, { encabezado: e }: FormatoTramite): boolean =>
  user.idUsuario != null && [e.firma1NoEmp, e.firma2NoEmp, e.firma3NoEmp].includes(user.idUsuario);

/** null = el usuario no puede ver ese trámite. */
export const cargarFormatoTramite = async (user: SessionUser, idTramite: number): Promise<FormatoTramite | null> => {
  const formato = await ceaData<FormatoTramite>(user, `NomTramites/${idTramite}/Formato`);
  if (firmaElTramite(user, formato) || esAdministradorRh(user.tramitesNivel)) return formato;
  return (await puedeOperarEmpleado(user, formato.encabezado.noEmp)) ? formato : null;
};
