// EmpleadoDto del backend CEA (api/Empleados/...). Solo se tipan los campos que usa viáticos.
export interface Empleado {
  empleado: number;
  activo: string;
  nombre: string;
  paterno: string;
  materno: string;
  nombreCompleto: string;
  idPue: number;
  descripcionPuesto: string;
  deptoUe: number;
  deptoComi: number;
  descripcionDepto: string;
  municipio: number;
  oficina: number;
  nivel: number;
  lugarTrab: number;
  supervisorId: number | null; // null = sin supervisor asignado
}
