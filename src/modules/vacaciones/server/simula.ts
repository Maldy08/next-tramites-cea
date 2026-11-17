import { NextRequest, NextResponse } from "next/server";
import type { ConsultaVacaciones } from "@/modules/vacaciones/dtos";
import { ceaData, errorResponse, fail, ok } from "@/shared/server/cea";
import { usuarioParaEmpleado } from "./acceso";

const esFechaISO = (valor: string | null): valor is string => !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor);

// GET /api/vacaciones/simula/[id]?desde=AAAA-MM-DD&hasta=AAAA-MM-DD: días hábiles del rango, festivos que no se
// contaron y reparto entre periodos (NomVacaciones/ConsultaVacaciones = FN_CONSULTA_VACACIONES).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, noEmp, error } = await usuarioParaEmpleado((await params).id);
    if (error) return error;

    const desde = req.nextUrl.searchParams.get("desde");
    const hasta = req.nextUrl.searchParams.get("hasta");
    if (!esFechaISO(desde) || !esFechaISO(hasta) || hasta < desde)
      return NextResponse.json(fail("Rango de fechas no válido"), { status: 400 });

    const consulta = await ceaData<ConsultaVacaciones>(user, `NomVacaciones/ConsultaVacaciones/${noEmp}/${desde}/${hasta}`);
    return NextResponse.json(ok(consulta));
  } catch (error) {
    return errorResponse(error);
  }
}
