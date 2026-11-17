import { NextRequest, NextResponse } from "next/server";
import type { DiaFestivo } from "@/modules/vacaciones/dtos";
import { ceaData, errorResponse, fail, ok } from "@/shared/server/cea";
import { usuarioParaEmpleado } from "./acceso";

const esFechaISO = (valor: string | null): valor is string => !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor);
const soloFecha = (valor: string | null) => (valor ? valor.slice(0, 10) : null);

// GET /api/vacaciones/festivos/[id]?desde=AAAA-MM-DD&hasta=AAAA-MM-DD: festivos que le tocan al empleado
// (NomDiasFestivos/Empleado: por tipo de empleado, sexo y oficina). Las fechas salen como AAAA-MM-DD.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        (festivos ?? []).map((f) => ({ ...f, fechaFestivo: soloFecha(f.fechaFestivo)!, fechaOficial: soloFecha(f.fechaOficial) }))
      )
    );
  } catch (error) {
    return errorResponse(error);
  }
}
