import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type {
  CatalogosViaticos,
  Empleado,
  FormatoViatico,
  GuardarViaticoRequest,
  GuardarViaticoResponse,
  Viatico,
  ViaticoListado,
} from "@/modules/viaticos/dtos";

// Todas pasan por el proxy de Next (src/app/api/*), que agrega el Bearer de la sesión.

export const getCatalogos = async (): Promise<CatalogosViaticos> =>
  (await DbAdapter.get<Result<CatalogosViaticos>>("viaticos/catalogos")).data;

export const getEmpleadoById = async (id: number): Promise<Empleado> =>
  (await DbAdapter.get<Result<Empleado>>(`viaticos/empleados/${id}`)).data;

export const getEmpleadosDepartamento = async (): Promise<Empleado[]> =>
  (await DbAdapter.get<Result<Empleado[]>>("viaticos/empleados/departamento")).data;

export const getViaticosByEmpleado = async (ejercicio: number, empleado: number): Promise<ViaticoListado[]> =>
  (await DbAdapter.get<Result<ViaticoListado[]>>(`viaticos/registros/empleado/${ejercicio}/${empleado}`)).data;

export const getViatico = async (ejercicio: number, oficina: number, noviat: number): Promise<Viatico> =>
  (await DbAdapter.get<Result<Viatico>>(`viaticos/registros/${ejercicio}/${oficina}/${noviat}`)).data;

export const createViatico = (data: GuardarViaticoRequest) =>
  DbAdapter.post<Result<GuardarViaticoResponse>>("viaticos/registros", data);

export const updateViatico = (data: GuardarViaticoRequest) =>
  DbAdapter.put<Result<GuardarViaticoResponse>>("viaticos/registros", data);

/** URL del PDF (mismo dominio; la cookie de sesión viaja sola). */
export const urlFormato = (formato: FormatoViatico, ejercicio: number, oficina: number, noviat: number) =>
  `/api/viaticos/pdf/${formato}/${ejercicio}/${oficina}/${noviat}`;
