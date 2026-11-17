import { NextRequest, NextResponse } from "next/server";
import type { DiaFestivo, EmpleadoPermiso, Relevo } from "@/modules/permisos/dtos";
import { ceaData, errorResponse, fail, ok, toInt } from "@/shared/server/cea";
import { TIPO_TRAMITE, type Tramite } from "@/shared/tramites";
import { usuarioParaEmpleado } from "./acceso";

type Params = { params: Promise<{ id: string }> };

const esFechaISO = (valor: string | null): valor is string => !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor);

const aFicha = (e: EmpleadoPermiso): EmpleadoPermiso => ({
  empleado: e.empleado,
  nombreCompleto: e.nombreCompleto,
  descripcionPuesto: e.descripcionPuesto,
  descripcionDepto: e.descripcionDepto,
  deptoComi: e.deptoComi,
});

// GET /api/permisos/empleado/[id]: ficha del beneficiario.
export async function getEmpleado(_: NextRequest, { params }: Params) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;
    return NextResponse.json(ok(aFicha(await ceaData<EmpleadoPermiso>(user, `Empleados/GetEmpleadoById/${noEmp}`))));
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/permisos/relevos/[id]: empleados activos que pueden cubrir a [id] (todos menos él).
export async function getRelevos(_: NextRequest, { params }: Params) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;
    const empleados = (await ceaData<Relevo[]>(user, "Empleados")) ?? [];
    return NextResponse.json(
      ok(
        empleados
          .filter((e) => e.empleado !== noEmp)
          .map(aFicha)
          .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"))
      )
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/permisos/festivos/[id]?desde&hasta: festivos que le tocan al empleado (tipo, sexo y oficina).
export async function getFestivos(req: NextRequest, { params }: Params) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;
    const desde = req.nextUrl.searchParams.get("desde");
    const hasta = req.nextUrl.searchParams.get("hasta");
    if (!esFechaISO(desde) || !esFechaISO(hasta) || hasta < desde)
      return NextResponse.json(fail("Rango de fechas no válido"), { status: 400 });
    const festivos = await ceaData<DiaFestivo[]>(user, `NomDiasFestivos/Empleado/${noEmp}/${desde}/${hasta}`);
    return NextResponse.json(
      ok<DiaFestivo[]>(
        (festivos ?? []).map((f) => ({
          fechaFestivo: f.fechaFestivo.slice(0, 10),
          descripcion: f.descripcion,
          horaEntrada: f.horaEntrada,
          horaSalida: f.horaSalida,
        }))
      )
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/permisos/solicitudes/[id]?ano=AAAA: permisos del empleado en el año (NomTramites/Empleado con tipo 3).
export async function getSolicitudes(req: NextRequest, { params }: Params) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;
    const ano = toInt(req.nextUrl.searchParams.get("ano") ?? "");
    if (Number.isNaN(ano)) return NextResponse.json(fail("Año no válido"), { status: 400 });
    const tramites = await ceaData<Tramite[]>(user, `NomTramites/Empleado/${noEmp}/${ano}?tipo=${TIPO_TRAMITE.permisos}`);
    return NextResponse.json(ok(tramites ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
